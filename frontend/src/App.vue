<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import {
  createSubscription,
  deleteSubscription,
  fetchSubscriptions,
  getApiErrorMessage
} from './api';

const subscriptions = ref([]);
const loading = ref(false);
const submitting = ref(false);
const deletingId = ref(null);
const errorMessage = ref('');
const successMessage = ref('');

const form = reactive({
  platform: '',
  planType: '',
  price: '',
  billingCycle: 'monthly',
  nextBillingDate: ''
});

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2
});

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
});

const monthlyTotal = computed(() => {
  return subscriptions.value.reduce((total, subscription) => {
    return total + (subscription.billingCycle === 'yearly' ? subscription.price / 12 : subscription.price);
  }, 0);
});

const yearlyTotal = computed(() => monthlyTotal.value * 12);

const upcomingCount = computed(() => {
  const now = new Date();
  const nextThirtyDays = new Date(now);
  nextThirtyDays.setDate(now.getDate() + 30);

  return subscriptions.value.filter((subscription) => {
    const billingDate = new Date(subscription.nextBillingDate);
    return billingDate >= now && billingDate <= nextThirtyDays;
  }).length;
});

function formatCurrency(value) {
  return currencyFormatter.format(value || 0);
}

function formatDate(value) {
  return dateFormatter.format(new Date(value));
}

function resetForm() {
  form.platform = '';
  form.planType = '';
  form.price = '';
  form.billingCycle = 'monthly';
  form.nextBillingDate = '';
}

async function loadSubscriptions() {
  loading.value = true;
  errorMessage.value = '';

  try {
    subscriptions.value = await fetchSubscriptions();
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function handleSubmit() {
  submitting.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    await createSubscription({
      platform: form.platform,
      planType: form.planType,
      price: Number(form.price),
      billingCycle: form.billingCycle,
      nextBillingDate: form.nextBillingDate
    });

    successMessage.value = '订阅已添加';
    resetForm();
    await loadSubscriptions();
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    submitting.value = false;
  }
}

async function handleDelete(subscription) {
  const confirmed = window.confirm(`确认删除 ${subscription.platform} 的订阅吗？`);
  if (!confirmed) return;

  deletingId.value = subscription.id;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    await deleteSubscription(subscription.id);
    successMessage.value = '订阅已删除';
    await loadSubscriptions();
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    deletingId.value = null;
  }
}

onMounted(loadSubscriptions);
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-slate-100">
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl"></div>
      <div class="absolute right-0 top-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl"></div>
    </div>

    <section class="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header class="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Subscription Hub</p>
          <h1 class="text-3xl font-bold tracking-tight text-white sm:text-5xl">个人会员订阅管理面板</h1>
          <p class="mt-3 max-w-2xl text-slate-400">集中管理平台订阅、扣费周期和未来支出，避免重复付费和遗忘续费。</p>
        </div>
        <button
          class="rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-white/15"
          type="button"
          @click="loadSubscriptions"
        >
          刷新列表
        </button>
      </header>

      <div class="mb-6 grid gap-4 md:grid-cols-3">
        <article class="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
          <p class="text-sm text-slate-400">本月预估总支出</p>
          <p class="mt-3 text-3xl font-bold text-white">{{ formatCurrency(monthlyTotal) }}</p>
          <p class="mt-2 text-xs text-cyan-200">年付订阅已均摊到每月</p>
        </article>
        <article class="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
          <p class="text-sm text-slate-400">全年预估总支出</p>
          <p class="mt-3 text-3xl font-bold text-white">{{ formatCurrency(yearlyTotal) }}</p>
          <p class="mt-2 text-xs text-violet-200">按当前订阅组合估算</p>
        </article>
        <article class="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
          <p class="text-sm text-slate-400">30 天内将扣费</p>
          <p class="mt-3 text-3xl font-bold text-white">{{ upcomingCount }} 项</p>
          <p class="mt-2 text-xs text-emerald-200">按下次扣费日期统计</p>
        </article>
      </div>

      <div v-if="errorMessage" class="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="mb-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
        {{ successMessage }}
      </div>

      <div class="grid gap-6 lg:grid-cols-[420px_1fr]">
        <section class="rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur">
          <h2 class="text-xl font-bold text-white">新增订阅</h2>
          <p class="mt-1 text-sm text-slate-400">填写平台、价格和扣费周期后自动同步到列表。</p>

          <form class="mt-6 space-y-4" @submit.prevent="handleSubmit">
            <label class="block">
              <span class="text-sm font-medium text-slate-300">平台名称</span>
              <input v-model.trim="form.platform" class="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300" placeholder="Netflix" required />
            </label>

            <label class="block">
              <span class="text-sm font-medium text-slate-300">订阅种类</span>
              <input v-model.trim="form.planType" class="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300" placeholder="4K 家庭车" required />
            </label>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block">
                <span class="text-sm font-medium text-slate-300">价格</span>
                <input v-model="form.price" class="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300" min="0" step="0.01" type="number" placeholder="68" required />
              </label>

              <label class="block">
                <span class="text-sm font-medium text-slate-300">计费周期</span>
                <select v-model="form.billingCycle" class="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-cyan-300">
                  <option value="monthly">月付</option>
                  <option value="yearly">年付</option>
                </select>
              </label>
            </div>

            <label class="block">
              <span class="text-sm font-medium text-slate-300">下次扣费日期</span>
              <input v-model="form.nextBillingDate" class="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none transition focus:border-cyan-300" type="date" required />
            </label>

            <button class="w-full rounded-2xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60" :disabled="submitting" type="submit">
              {{ submitting ? '提交中...' : '添加订阅' }}
            </button>
          </form>
        </section>

        <section class="rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl backdrop-blur">
          <div class="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-bold text-white">订阅明细</h2>
              <p class="mt-1 text-sm text-slate-400">按下次扣费日期升序排列。</p>
            </div>
            <span class="rounded-full bg-white/10 px-3 py-1 text-sm text-slate-300">{{ subscriptions.length }} 项</span>
          </div>

          <div v-if="loading" class="rounded-2xl border border-white/10 bg-slate-900/70 p-8 text-center text-slate-400">
            正在加载订阅数据...
          </div>

          <div v-else-if="subscriptions.length === 0" class="rounded-2xl border border-dashed border-white/20 bg-slate-900/50 p-8 text-center">
            <p class="font-semibold text-white">暂无订阅记录</p>
            <p class="mt-2 text-sm text-slate-400">从左侧添加你的第一个会员订阅。</p>
          </div>

          <div v-else class="overflow-hidden rounded-2xl border border-white/10">
            <div class="hidden grid-cols-[1.3fr_1fr_0.8fr_1fr_96px] bg-slate-900/80 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 md:grid">
              <span>平台</span>
              <span>周期</span>
              <span>价格</span>
              <span>扣费日期</span>
              <span class="text-right">操作</span>
            </div>

            <div class="divide-y divide-white/10">
              <article v-for="subscription in subscriptions" :key="subscription.id" class="grid gap-3 bg-slate-950/40 px-4 py-4 transition hover:bg-slate-900/70 md:grid-cols-[1.3fr_1fr_0.8fr_1fr_96px] md:items-center">
                <div>
                  <p class="font-semibold text-white">{{ subscription.platform }}</p>
                  <p class="text-sm text-slate-400">{{ subscription.planType }}</p>
                </div>

                <div>
                  <span :class="subscription.billingCycle === 'monthly' ? 'bg-cyan-400/10 text-cyan-200 ring-cyan-300/30' : 'bg-violet-400/10 text-violet-200 ring-violet-300/30'" class="inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1">
                    {{ subscription.billingCycle === 'monthly' ? '月付' : '年付' }}
                  </span>
                </div>

                <p class="font-semibold text-white">{{ formatCurrency(subscription.price) }}</p>
                <p class="text-sm text-slate-300">{{ formatDate(subscription.nextBillingDate) }}</p>

                <button class="justify-self-start rounded-full border border-red-300/20 px-3 py-1.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/10 disabled:opacity-50 md:justify-self-end" :disabled="deletingId === subscription.id" type="button" @click="handleDelete(subscription)">
                  {{ deletingId === subscription.id ? '删除中' : '删除' }}
                </button>
              </article>
            </div>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>
