<template>
  <Form
    class="fieldset bg-base-200 border-base-300 rounded-box w-sm max-w-[calc(100vw-2rem)] border p-4"
    :validation-schema="signupSchema"
    @submit="handleSignup"
    v-slot="{ isSubmitting }"
  >
    <legend class="fieldset-legend">Signup</legend>

    <label class="label">Display name</label>
    <Field
      name="displayName"
      type="text"
      class="input w-full"
      placeholder="Display name"
    />
    <ErrorMessage name="displayName" class="text-error text-sm mt-1" />

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

    <label class="label">Confirm Password</label>
    <Field
      name="confirmPassword"
      type="password"
      class="input w-full"
      placeholder="Confirm Password"
    />
    <ErrorMessage name="confirmPassword" class="text-error text-sm mt-1" />

    <p v-if="successMessage" class="alert alert-success text-sm mt-4">
      {{ successMessage }}
    </p>

    <p v-if="errorMessage" class="alert alert-error text-sm mt-4">
      {{ errorMessage }}
    </p>

    <button class="btn btn-neutral mt-4" type="submit" :disabled="isSubmitting">
      <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
      <span>{{ isSubmitting ? "Signing up..." : "Signup" }}</span>
    </button>

    <button
      class="btn btn-outline btn-primary"
      type="button"
      @click="router.push({ name: 'login' })"
    >
      To Login
    </button>
  </Form>
</template>

<script setup>
import { signUp } from "@/services/apiAuth.js";
import { ErrorMessage } from "vee-validate";
import { Form } from "vee-validate";
import { Field } from "vee-validate";
import { ref } from "vue";
import { useRouter } from "vue-router";
import * as yup from "yup";

const router = useRouter();
const successMessage = ref("");
const errorMessage = ref("");

const signupSchema = yup.object({
  displayName: yup
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .required("Display name is required"),
  email: yup.string().email("Invalid email").required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required"),
});

async function handleSignup(values) {
  successMessage.value = "";
  errorMessage.value = "";

  try {
    const result = await signUp({
      email: values.email,
      password: values.password,
      displayName: values.displayName.trim(),
    });

    if (result.needsEmailConfirmation) {
      successMessage.value =
        "Signup succeeded. Please confirm your email, then login.";
      return;
    }

    successMessage.value = "Signup succeeded. Redirecting to login...";
    setTimeout(() => {
      router.push({ name: "login" });
    }, 800);
  } catch (error) {
    errorMessage.value = error.message;
  }
}
</script>

<style lang="scss" scoped></style>
