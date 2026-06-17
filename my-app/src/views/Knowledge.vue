<template>
  <div class="knowledge-container">
    <h2>知识库管理</h2>
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>知识库列表</span>
              <el-button type="primary" size="small" @click="createKb">新建知识库</el-button>
            </div>
          </template>
          <el-menu :default-active="activeKbId" @select="selectKb" class="kb-menu">
            <el-menu-item v-for="kb in kbs" :key="kb.id" :index="kb.id">
              <span class="kb-name" :title="kb.name">{{ kb.name }}</span>
              <el-button type="danger" link size="small" @click.stop="deleteKb(kb.id)">删除</el-button>
            </el-menu-item>
            <div v-if="kbs.length === 0" class="empty-tip">暂无知识库，请新建</div>
          </el-menu>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card class="box-card" v-if="activeKb">
          <template #header>
            <div class="card-header">
              <el-input v-model="activeKb.name" style="width: 250px" @change="saveKbs" placeholder="请输入知识库名称" />
              <el-button type="success" size="small" @click="uploadFiles">上传文档</el-button>
            </div>
          </template>
          <div class="files-list mb-4" v-if="activeKb.files && activeKb.files.length > 0">
            <span style="font-size: 14px; margin-right: 8px;">已解析的文件：</span>
            <el-tag v-for="f in activeKb.files" :key="f" class="mr-2 mb-2" closable @close="removeFile(f)">{{ f }}</el-tag>
          </div>
          <el-input
            v-model="activeKb.content"
            type="textarea"
            :rows="18"
            placeholder="知识库的内容（上传 txt/md/docx 文档后，系统会自动提取纯文本追加于此，您也可以在此手动编辑补充）"
            @change="saveKbs"
          />
        </el-card>
        <el-empty v-else description="请从左侧选择或新建一个知识库" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getSettings, saveSettings, selectAndExtractTextFiles } from '../utils/bridge'
import { ElMessage, ElMessageBox } from 'element-plus'

const kbs = ref<any[]>([])
const activeKbId = ref('')

const activeKb = computed(() => kbs.value.find(k => k.id === activeKbId.value))

onMounted(async () => {
  try {
    const settings = await getSettings()
    kbs.value = settings.knowledgeBases || []
    if (kbs.value.length > 0) activeKbId.value = kbs.value[0].id
  } catch (error) {
    console.error('Failed to load settings', error)
  }
})

const saveKbs = async () => {
  try {
    const settings = await getSettings()
    settings.knowledgeBases = kbs.value
    await saveSettings(settings)
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const createKb = async () => {
  const newKb = {
    id: Date.now().toString(),
    name: '新建知识库 ' + (kbs.value.length + 1),
    content: '',
    files: []
  }
  kbs.value.push(newKb)
  activeKbId.value = newKb.id
  await saveKbs()
}

const selectKb = (id: string) => {
  activeKbId.value = id
}

const deleteKb = async (id: string) => {
  try {
    await ElMessageBox.confirm('确认删除该知识库？删除后无法恢复。', '提示', { type: 'warning' })
    kbs.value = kbs.value.filter(k => k.id !== id)
    if (activeKbId.value === id) {
      activeKbId.value = kbs.value.length > 0 ? kbs.value[0].id : ''
    }
    await saveKbs()
    ElMessage.success('已删除')
  } catch {
    // cancelled
  }
}

const uploadFiles = async () => {
  try {
    const files = await selectAndExtractTextFiles()
    if (files.length > 0) {
      if (!activeKb.value.files) activeKb.value.files = []
      
      let appendedContent = ''
      for (const f of files) {
        if (!activeKb.value.files.includes(f.name)) {
          activeKb.value.files.push(f.name)
        }
        appendedContent += `\n\n--- 以下内容提取自文件：${f.name} ---\n${f.content}`
      }
      activeKb.value.content += appendedContent
      await saveKbs()
      ElMessage.success(`成功解析并添加 ${files.length} 个文件内容`)
    }
  } catch (error: any) {
    ElMessage.error('文件读取失败: ' + error.message)
  }
}

const removeFile = async (filename: string) => {
  activeKb.value.files = activeKb.value.files.filter((f: string) => f !== filename)
  // 注意：移除文件标签并不会自动删除内容里的文本，需用户手动清理文本框。这里主要用于文件标记管理。
  await saveKbs()
}
</script>

<style scoped>
.knowledge-container {
  max-width: 1200px;
  margin: 0 auto;
}
h2 {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.kb-menu {
  border-right: none;
}
.el-menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.kb-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.empty-tip {
  padding: 20px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}
.mr-2 {
  margin-right: 8px;
}
.mb-2 {
  margin-bottom: 8px;
}
.mb-4 {
  margin-bottom: 16px;
}
</style>
