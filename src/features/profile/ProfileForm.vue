<script setup lang="ts">
import { ref, reactive } from "vue";

// 定义表单数据类型
interface FormData {
  username: string;
  category: string;
  bio: string;
  notifications: boolean;
  gender: "male" | "female" | "other" | "";
  avatar: File | null;
  agreement: boolean;
}

// 初始化响应式数据
const formData = reactive<FormData>({
  username: "",
  category: "",
  bio: "",
  notifications: true,
  gender: "",
  avatar: null,
  agreement: false,
});

const isSubmitting = ref(false);

// 处理文件上传
const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    formData.avatar = target.files[0];
  }
};

// 提交表单
const handleSubmit = async () => {
  isSubmitting.value = true;
  // 模拟异步请求
  console.log("提交的数据：", formData);

  setTimeout(() => {
    isSubmitting.value = false;
    alert("提交成功！");
  }, 1500);
};
</script>

<template>
  <div class="flex justify-center items-center min-h-screen bg-base-200 p-4">
    <div class="card w-full max-w-2xl bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-2xl font-bold mb-6 text-primary">
          基本信息注册
        </h2>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">名称/姓名</span>
              </label>
              <input
                v-model="formData.username"
                type="text"
                placeholder="请输入"
                class="input input-bordered w-full focus:input-primary"
                required
              />
            </div>

            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">分类</span>
              </label>
              <select
                v-model="formData.category"
                class="select select-bordered focus:select-primary"
                required
              >
                <option disabled value="">请选择类型</option>
                <option value="tech">技术开发</option>
                <option value="design">艺术设计</option>
                <option value="life">生活日常</option>
              </select>
            </div>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">选择性别</span>
            </label>
            <div class="flex gap-6">
              <label class="label cursor-pointer flex gap-2">
                <input
                  v-model="formData.gender"
                  type="radio"
                  value="male"
                  class="radio radio-primary"
                />
                <span class="label-text">男</span>
              </label>
              <label class="label cursor-pointer flex gap-2">
                <input
                  v-model="formData.gender"
                  type="radio"
                  value="female"
                  class="radio radio-primary"
                />
                <span class="label-text">女</span>
              </label>
            </div>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">个人简介/描述</span>
            </label>
            <textarea
              v-model="formData.bio"
              class="textarea textarea-bordered h-24 focus:textarea-primary"
              placeholder="介绍一下你自己..."
            ></textarea>
          </div>

          <div class="form-control w-full">
            <label class="label">
              <span class="label-text font-medium">上传头像</span>
            </label>
            <input
              @change="handleFileChange"
              type="file"
              class="file-input file-input-bordered file-input-primary w-full"
            />
          </div>

          <div class="divider">偏好设置</div>

          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text font-medium">接收邮件通知</span>
              <input
                v-model="formData.notifications"
                type="checkbox"
                class="toggle toggle-primary"
              />
            </label>
          </div>

          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-3">
              <input
                v-model="formData.agreement"
                type="checkbox"
                class="checkbox checkbox-sm checkbox-primary"
                required
              />
              <span class="label-text text-xs"
                >我已阅读并同意《服务协议》与《隐私保护指引》</span
              >
            </label>
          </div>

          <div class="card-actions justify-end mt-4">
            <button
              type="submit"
              class="btn btn-primary w-full md:w-32"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting" class="loading loading-spinner"></span>
              提交
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 这里可以根据需要添加额外的微调样式 */
</style>
