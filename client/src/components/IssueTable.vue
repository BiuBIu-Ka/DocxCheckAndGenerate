<script setup lang="ts">
import { computed } from 'vue'
import type { ReviewIssue } from '@/types/platform'

const props = defineProps<{
  issues: ReviewIssue[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update-status', payload: { id: string; status: ReviewIssue['status'] }): void
}>()

const columns = computed(() => [
  { title: '问题', dataIndex: 'title', key: 'title' },
  { title: '级别', dataIndex: 'severity', key: 'severity', width: 110 },
  { title: '规则来源', dataIndex: 'rule', key: 'rule', width: 180 },
  { title: '定位', dataIndex: 'location', key: 'location', width: 180 },
  { title: '整改建议', dataIndex: 'suggestion', key: 'suggestion' },
  { title: '状态', key: 'status', width: 150 },
])

const tagColorMap: Record<ReviewIssue['severity'], string> = {
  high: 'error',
  medium: 'warning',
  low: 'default',
}

function getSeverityColor(severity: ReviewIssue['severity']) {
  return tagColorMap[severity]
}

function getSeverityLabel(severity: ReviewIssue['severity']) {
  return severity === 'high' ? '高' : severity === 'medium' ? '中' : '低'
}

function updateStatus(id: string, status: ReviewIssue['status']) {
  emit('update-status', { id, status })
}

function handleStatusChange(value: string | number, id: string) {
  updateStatus(id, value as ReviewIssue['status'])
}
</script>

<template>
  <a-table
    :columns="columns"
    :data-source="issues"
    :loading="loading"
    :pagination="false"
    row-key="id"
    class="platform-table"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'severity'">
        <a-tag :color="getSeverityColor(record.severity as ReviewIssue['severity'])">
          {{ getSeverityLabel(record.severity as ReviewIssue['severity']) }}
        </a-tag>
      </template>
      <template v-else-if="column.key === 'status'">
        <a-segmented
          :value="record.status"
          size="small"
          :options="[
            { label: '待处理', value: 'open' },
            { label: '已确认', value: 'accepted' },
            { label: '已解决', value: 'resolved' },
          ]"
          @change="handleStatusChange($event, record.id)"
        />
      </template>
    </template>
  </a-table>
</template>
