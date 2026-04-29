import { faker } from "@faker-js/faker";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

loadEnvFiles();

const SHIFT_TEMPLATES = [
  { start: "00:00:00", end: "08:00:00" },
  { start: "08:00:00", end: "16:00:00" },
  { start: "16:00:00", end: "23:59:00" },
];

async function main() {
  const config = readConfig();
  const supabase = createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const locations = await fetchLocations(supabase);
  if (locations.length === 0) {
    throw new Error(
      "No locations found. Insert locations before seeding users.",
    );
  }

  const createdByProfileId = await getCreatedByProfileId(supabase);
  const runTag = Date.now().toString(36);

  let createdAuthUsers = 0;
  let createdProfiles = 0;
  let createdEmployees = 0;
  let failed = 0;

  const seededLocationIds = new Set();

  for (let i = 0; i < config.count; i += 1) {
    const location = faker.helpers.arrayElement(locations);
    const employeeId = crypto.randomUUID();
    const employeeCode = `EMP-SEED-${runTag}-${String(i + 1).padStart(5, "0")}`;
    const fullName = faker.person.fullName();
    const email = buildSeedEmail(runTag, i, config.emailDomain);

    try {
      const authResult = await supabase.auth.admin.createUser({
        email,
        password: config.defaultPassword,
        email_confirm: true,
        user_metadata: {
          display_name: fullName,
          employee_id: employeeId,
          employee_code: employeeCode,
        },
      });

      if (authResult.error) {
        throw new Error(`Auth create failed: ${authResult.error.message}`);
      }

      const userId = authResult.data.user?.id;
      if (!userId) {
        throw new Error("Auth create failed: missing user id.");
      }

      createdAuthUsers += 1;
      seededLocationIds.add(location.id);

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          display_name: fullName,
          employee_id: employeeId,
          employee_code: employeeCode,
          role: "employee",
        },
        { onConflict: "id" },
      );

      if (profileError) {
        throw new Error(`Profile upsert failed: ${profileError.message}`);
      }

      createdProfiles += 1;

      const { error: employeeError } = await supabase.from("employees").upsert(
        {
          id: employeeId,
          employee_code: employeeCode,
          name: fullName,
          email,
          phone: faker.phone.number("09########"),
          department_id: null,
          location_id: location.id,
          position: "Front Desk Clerk",
          employment_type: faker.helpers.arrayElement([
            "full_time",
            "part_time",
          ]),
          status: "active",
          joined_at: faker.date.past({ years: 2 }).toISOString().slice(0, 10),
        },
        { onConflict: "id" },
      );

      if (employeeError) {
        throw new Error(`Employee upsert failed: ${employeeError.message}`);
      }

      createdEmployees += 1;
    } catch (error) {
      failed += 1;
      console.error(`[seed-user-${i + 1}] ${error.message}`);
    }
  }

  let insertedShifts = 0;
  if (config.withShifts && seededLocationIds.size > 0) {
    insertedShifts = await seedShifts(supabase, {
      locationIds: Array.from(seededLocationIds),
      createdByProfileId,
      weeks: config.shiftWeeks,
    });
  }

  console.log("\nSeed completed");
  console.log(`- auth users created: ${createdAuthUsers}`);
  console.log(`- profiles upserted: ${createdProfiles}`);
  console.log(`- employees upserted: ${createdEmployees}`);
  console.log(`- shifts inserted: ${insertedShifts}`);
  console.log(`- failed rows: ${failed}`);
}

function readConfig() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_URL.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return {
    url,
    serviceRoleKey,
    userCount: toInt(process.env.SEED_USER_COUNT, 80),
    defaultPassword: process.env.SEED_DEFAULT_PASSWORD || "SeedPass#123456",
    emailDomain: process.env.SEED_EMAIL_DOMAIN || "seed.local",
    withShifts: toBoolean(process.env.SEED_WITH_SHIFTS, false),
    shiftWeeks: toInt(process.env.SEED_SHIFT_WEEKS, 2),
  };
}

async function fetchLocations(supabase) {
  const { data, error } = await supabase
    .from("locations")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch locations: ${error.message}`);
  }

  return data;
}

async function getCreatedByProfileId(supabase) {
  const { data: admin, error: adminError } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();

  if (!adminError && admin?.id) {
    return admin.id;
  }

  const { data: anyProfile, error: anyProfileError } = await supabase
    .from("profiles")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (!anyProfileError && anyProfile?.id) {
    return anyProfile.id;
  }

  return null;
}

function buildSeedEmail(runTag, index, domain) {
  const randomPart = faker.string.alphanumeric(6).toLowerCase();
  return `seed.${runTag}.${index + 1}.${randomPart}@${domain}`;
}

async function seedShifts(supabase, options) {
  const { locationIds, createdByProfileId, weeks } = options;

  const employeesByLocation = await fetchActiveEmployeesByLocation(
    supabase,
    locationIds,
  );
  const range = getDateRangeForWeeks(weeks);
  const occupiedKeys = await fetchOccupiedSlotKeys(
    supabase,
    locationIds,
    range.startISO,
    range.endISO,
  );

  const rows = [];

  for (const locationId of locationIds) {
    const locationEmployees = employeesByLocation.get(locationId) || [];
    if (locationEmployees.length === 0) {
      continue;
    }

    for (const workDate of range.allDates) {
      const usedEmployeeIds = new Set();

      for (const template of SHIFT_TEMPLATES) {
        const slotKey = toSlotKey(locationId, workDate, template.start);
        if (occupiedKeys.has(slotKey)) {
          continue;
        }

        const employee = pickEmployeeWithoutSameDayConflict(
          locationEmployees,
          usedEmployeeIds,
        );

        usedEmployeeIds.add(employee.id);

        rows.push({
          id: crypto.randomUUID(),
          employee_id: employee.id,
          work_date: workDate,
          start_time: template.start,
          end_time: template.end,
          break_minutes: 0,
          location_id: locationId,
          status: pickShiftStatus(),
          created_by: createdByProfileId,
        });
      }
    }

    function loadEnvFiles() {
      const scriptDir = path.dirname(fileURLToPath(import.meta.url));
      const projectRoot = path.resolve(scriptDir, "..");
      const envFiles = [".env.local", ".env"];

      for (const fileName of envFiles) {
        const filePath = path.join(projectRoot, fileName);

        if (!fs.existsSync(filePath)) {
          continue;
        }

        const content = fs.readFileSync(filePath, "utf8");
        applyEnvContent(content);
      }
    }

    function applyEnvContent(content) {
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();

        if (!line || line.startsWith("#") || !line.includes("=")) {
          continue;
        }

        const equalIndex = line.indexOf("=");
        const key = line.slice(0, equalIndex).trim();
        let value = line.slice(equalIndex + 1).trim();

        if (!key || Object.hasOwn(process.env, key)) {
          continue;
        }

        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        process.env[key] = value;
      }
    }
  }

  if (rows.length === 0) {
    return 0;
  }

  const chunkSize = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from("shifts").insert(chunk);

    if (error) {
      throw new Error(`Failed to insert shifts: ${error.message}`);
    }

    inserted += chunk.length;
  }

  return inserted;
}

async function fetchActiveEmployeesByLocation(supabase, locationIds) {
  const { data, error } = await supabase
    .from("employees")
    .select("id, location_id")
    .in("location_id", locationIds)
    .eq("status", "active");

  if (error) {
    throw new Error(`Failed to fetch active employees: ${error.message}`);
  }

  const map = new Map();

  for (const row of data) {
    if (!map.has(row.location_id)) {
      map.set(row.location_id, []);
    }

    map.get(row.location_id).push(row);
  }

  return map;
}

async function fetchOccupiedSlotKeys(
  supabase,
  locationIds,
  startDate,
  endDate,
) {
  const { data, error } = await supabase
    .from("shifts")
    .select("location_id, work_date, start_time, status")
    .in("location_id", locationIds)
    .gte("work_date", startDate)
    .lte("work_date", endDate);

  if (error) {
    throw new Error(`Failed to fetch existing shifts: ${error.message}`);
  }

  const keys = new Set();

  for (const row of data) {
    if (row.status === "cancelled") {
      continue;
    }

    keys.add(
      toSlotKey(row.location_id, row.work_date, normalizeTime(row.start_time)),
    );
  }

  return keys;
}

function getDateRangeForWeeks(weeks) {
  const start = startOfWeek(new Date());
  const totalDays = Math.max(1, weeks) * 7;
  const allDates = [];

  for (let i = 0; i < totalDays; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    allDates.push(toISODate(date));
  }

  return {
    startISO: allDates[0],
    endISO: allDates[allDates.length - 1],
    allDates,
  };
}

function startOfWeek(input) {
  const date = new Date(input);
  const weekday = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - weekday);
  return date;
}

function toISODate(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeTime(value) {
  return String(value).slice(0, 8);
}

function toSlotKey(locationId, workDate, startTime) {
  return `${locationId}|${workDate}|${startTime}`;
}

function pickEmployeeWithoutSameDayConflict(employees, usedEmployeeIds) {
  const available = employees.filter(
    (employee) => !usedEmployeeIds.has(employee.id),
  );

  if (available.length > 0) {
    return faker.helpers.arrayElement(available);
  }

  return faker.helpers.arrayElement(employees);
}

function pickShiftStatus() {
  const roll = Math.random();

  if (roll < 0.82) {
    return "scheduled";
  }

  if (roll < 0.94) {
    return "changed";
  }

  return "cancelled";
}

function toBoolean(input, fallback) {
  if (input === undefined) {
    return fallback;
  }

  const text = String(input).trim().toLowerCase();
  return text === "1" || text === "true" || text === "yes" || text === "on";
}

function toInt(input, fallback) {
  const value = Number.parseInt(input ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
