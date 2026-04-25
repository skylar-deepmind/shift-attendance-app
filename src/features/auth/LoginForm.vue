<template>
  <Form
    class="fieldset bg-base-200 border-base-300 rounded-box w-sm max-w-[calc(100vw-2rem)] border p-4"
    :validation-schema="loginSchema"
    @submit="handleLogin"
    v-slot="{ isSubmitting }"
  >
    <legend class="fieldset-legend">Login</legend>

    <label class="label">Email</label>
    <Field
      name="email"
      type="email"
      class="input w-full"
      placeholder="Email"
    />
    <ErrorMessage name="email" class="text-error text-sm mt-1" />

    <label class="label">Password</label>
    <Field
      name="password"
      type="password"
      class="input w-full"
      placeholder="Password"
    />
    <ErrorMessage name="password" class="text-error text-sm mt-1" />

    <p v-if="errorMessage" class="alert alert-error text-sm mt-4">
      {{ errorMessage }}
    </p>

    <button class="btn btn-neutral mt-4" type="submit" :disabled="isSubmitting">
      <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
      <span>{{ isSubmitting ? "Logging in..." : "Login" }}</span>
    </button>

    <button
      class="btn btn-outline btn-primary"
      type="button"
      @click="router.push({ name: 'signup' })"
    >
      To Signup
    </button>
  </Form>
</template>

<script setup>
import {
  getCurrentProfile,
  hasEmployeeRecord,
  signIn,
} from "@/services/apiAuth.js";
import { ErrorMessage, Field, Form } from "vee-validate";
import { ref } from "vue";
import { useRouter } from "vue-router";
import * as yup from "yup";

const router = useRouter();
const errorMessage = ref("");

const loginSchema = yup.object({
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup.string().required("Password is required"),
});

async function handleLogin(values) {
  errorMessage.value = "";

  try {
    await signIn(values.email, values.password);
    const profile = await getCurrentProfile();

    if (!(await hasEmployeeRecord(profile?.employee_id))) {
      router.push({ name: "employee-form" });
      return;
    }

    router.push({ name: "profile" });
  } catch (error) {
    errorMessage.value = error.message;
  }
}
</script>
