<template>
  <div class="page-shell">
    <div class="page-header">
      <div>
        <div class="page-eyebrow">Knowledge</div>
        <h2>知识库</h2>
        <p>维护知识正文、文件来源和统计信息，方便在生成中台进行选择和检索。</p>
      </div>
    </div>

    <div class="page-grid">
      <KnowledgeListPanel
        :knowledge-bases="knowledgeBases"
        :selected-id="selectedKnowledgeBaseId"
        @create="createKnowledgeBase"
        @select="selectKnowledgeBase"
        @delete="deleteKnowledgeBase"
      />

      <KnowledgeEditorPanel
        :knowledge-base="currentKnowledgeBase"
        :saving="saving"
        @update:knowledge-base="currentKnowledgeBase = $event"
        @upload="uploadFiles"
        @save="saveKnowledgeBase"
      />

      <KnowledgeStatsPanel
        :knowledge-base="currentKnowledgeBase"
        @remove-file="removeFile"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import KnowledgeListPanel from '../components/knowledge/KnowledgeListPanel.vue'
import KnowledgeEditorPanel from '../components/knowledge/KnowledgeEditorPanel.vue'
import KnowledgeStatsPanel from '../components/knowledge/KnowledgeStatsPanel.vue'
import type { KnowledgeBaseRecord } from '../types/app'
import { listKnowledgeBases, saveKnowledgeBases, uploadKnowledgeFiles } from '../services/knowledgeService'
import { useAppConfigStore } from '../stores/appConfig'

const appConfig = useAppConfigStore()
const knowledgeBases = ref<KnowledgeBaseRecord[]>([])
const selectedKnowledgeBaseId = ref('')
const currentKnowledgeBase = ref<KnowledgeBaseRecord | undefined>()
const saving = ref(false)

async function refreshKnowledgeBases() {
  knowledgeBases.value = await listKnowledgeBases()
  if (!selectedKnowledgeBaseId.value && knowledgeBases.value[0]) {
    await selectKnowledgeBase(knowledgeBases.value[0].id)
  }
}

async function selectKnowledgeBase(id: string) {
  selectedKnowledgeBaseId.value = id
  const found = knowledgeBases.value.find((item) => item.id === id)
  currentKnowledgeBase.value = found ? JSON.parse(JSON.stringify(found)) : undefined
}

async function createKnowledgeBase() {
  const next: KnowledgeBaseRecord = {
    id: Date.now().toString(),
    name: `新建知识库 ${knowledgeBases.value.length + 1}`,
    content: '',
    files: [],
    updatedAt: new Date().toISOString(),
  }
  knowledgeBases.value = [...knowledgeBases.value, next]
  currentKnowledgeBase.value = next
  selectedKnowledgeBaseId.value = next.id
  await saveKnowledgeBases(knowledgeBases.value)
  await appConfig.load()
}

async function saveKnowledgeBase() {
  if (!currentKnowledgeBase.value) return
  saving.value = true
  try {
    const next = knowledgeBases.value.map((item) =>
      item.id === currentKnowledgeBase.value?.id ? currentKnowledgeBase.value : item,
    )
    knowledgeBases.value = await saveKnowledgeBases(next)
    await appConfig.load()
    await selectKnowledgeBase(currentKnowledgeBase.value.id)
    ElMessage.success('知识库已保存')
  } catch (error: any) {
    ElMessage.error(`保存失败: ${error.message}`)
  } finally {
    saving.value = false
  }
}

async function deleteKnowledgeBase(id: string) {
  try {
    await ElMessageBox.confirm('确定删除这个知识库吗？', '提示', { type: 'warning' })
    knowledgeBases.value = await saveKnowledgeBases(knowledgeBases.value.filter((item) => item.id !== id))
    await appConfig.load()
    if (selectedKnowledgeBaseId.value === id) {
      selectedKnowledgeBaseId.value = ''
      currentKnowledgeBase.value = undefined
    }
    await refreshKnowledgeBases()
    ElMessage.success('知识库已删除')
  } catch {
    // ignore
  }
}

async function uploadFiles() {
  if (!currentKnowledgeBase.value) return
  try {
    const files = await uploadKnowledgeFiles()
    if (files.length === 0) return

    const nextFiles = [...currentKnowledgeBase.value.files]
    let content = currentKnowledgeBase.value.content
    for (const file of files) {
      if (!nextFiles.includes(file.name)) nextFiles.push(file.name)
      content += `\n\n--- 以下内容提取自文件：${file.name} ---\n${file.content}`
    }

    currentKnowledgeBase.value = {
      ...currentKnowledgeBase.value,
      files: nextFiles,
      content,
    }
    await saveKnowledgeBase()
    ElMessage.success(`成功导入 ${files.length} 个文件`)
  } catch (error: any) {
    ElMessage.error(`文件读取失败: ${error.message}`)
  }
}

async function removeFile(filename: string) {
  if (!currentKnowledgeBase.value) return
  currentKnowledgeBase.value = {
    ...currentKnowledgeBase.value,
    files: currentKnowledgeBase.value.files.filter((item) => item !== filename),
  }
  await saveKnowledgeBase()
  ElMessage.warning('已移除文件标签，正文内容需手动确认是否删除')
}

onMounted(async () => {
  await refreshKnowledgeBases()
})
</script>

<style scoped>
.page-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-eyebrow,
.page-header p {
  color: var(--text-secondary);
  margin: 0;
}

.page-header h2 {
  margin: 6px 0;
  color: var(--text-primary);
}

.page-grid {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr) 320px;
  gap: 16px;
}

@media (max-width: 1380px) {
  .page-grid {
    grid-template-columns: 1fr;
  }
}
</style>
