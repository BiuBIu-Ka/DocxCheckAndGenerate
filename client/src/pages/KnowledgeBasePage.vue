
<script setup lang="ts">
import { onMounted, ref, reactive, h } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined, DeleteOutlined, EditOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'
import axios from 'axios'

const rules = ref([])
const terms = ref([])
const loading = ref(false)
const activeTab = ref('rules')

const editModalVisible = ref(false)
const editType = ref<'rule' | 'term'>('rule')
const currentEditId = ref<number | null>(null)

const ruleForm = reactive({
  docType: 'SRS',
  sectionName: '',
  requirementType: 'mandatory',
  description: ''
})

const termForm = reactive({
  standardName: '',
  forbiddenTerms: '',
  description: ''
})

async function loadData() {
  loading.value = true
  try {
    const [rRes, tRes] = await Promise.all([
      axios.get('/api/knowledge/rules'),
      axios.get('/api/knowledge/terms')
    ])
    rules.value = rRes.data
    terms.value = tRes.data
  } catch (e) {
    message.error('加载知识库失败')
  } finally {
    loading.value = false
  }
}

async function handleAddRule() {
  try {
    await axios.post('/api/knowledge/rules', ruleForm)
    message.success('规则添加成功')
    Object.assign(ruleForm, { sectionName: '', description: '' })
    loadData()
  } catch (e) {
    message.error('添加失败')
  }
}

async function handleAddTerm() {
  try {
    await axios.post('/api/knowledge/terms', termForm)
    message.success('术语添加成功')
    Object.assign(termForm, { standardName: '', forbiddenTerms: '', description: '' })
    loadData()
  } catch (e) {
    message.error('添加失败')
  }
}

async function handleDeleteRule(id: number) {
  Modal.confirm({
    title: '确定删除此规则吗？',
    onOk: async () => {
      await axios.delete(`/api/knowledge/rules/${id}`)
      message.success('规则已删除')
      loadData()
    }
  })
}

async function handleDeleteTerm(id: number) {
  Modal.confirm({
    title: '确定删除此术语吗？',
    onOk: async () => {
      await axios.delete(`/api/knowledge/terms/${id}`)
      message.success('术语已删除')
      loadData()
    }
  })
}

function openEditRule(rule: any) {
  editType.value = 'rule'
  currentEditId.value = rule.id
  Object.assign(ruleForm, rule)
  editModalVisible.value = true
}

function openEditTerm(term: any) {
  editType.value = 'term'
  currentEditId.value = term.id
  Object.assign(termForm, term)
  editModalVisible.value = true
}

async function handleEditSave() {
  try {
    if (editType.value === 'rule') {
      await axios.put(`/api/knowledge/rules/${currentEditId.value}`, ruleForm)
    } else {
      await axios.put(`/api/knowledge/terms/${currentEditId.value}`, termForm)
    }
    message.success('保存成功')
    editModalVisible.value = false
    loadData()
  } catch (e) {
    message.error('保存失败')
  }
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-6">
    <div class="hero-section">
      <div class="hero-title">GJB 知识库维护</div>
      <div class="hero-desc">在这里维护全局默认规则与术语基线；模板工作台可一键同步这些知识，并在模板内继续精细化调整。</div>
    </div>

    <a-tabs v-model:activeKey="activeTab" type="line" class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <a-tab-pane key="rules" tab="GJB 审查规则">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div class="lg:col-span-1">
            <a-card title="快速添加规则" size="small" :bordered="false" class="bg-gray-50">
              <a-form layout="vertical">
                <a-form-item label="文档类型">
                  <a-select v-model:value="ruleForm.docType">
                    <a-select-option value="SRS">软件需求规格说明 (SRS)</a-select-option>
                    <a-select-option value="SDD">软件设计说明 (SDD)</a-select-option>
                    <a-select-option value="STP">软件测试计划 (STP)</a-select-option>
                  </a-select>
                </a-form-item>
                <a-form-item label="章节名称">
                  <a-input v-model:value="ruleForm.sectionName" placeholder="例如：1. 范围" />
                </a-form-item>
                <a-form-item label="要求类型">
                  <a-radio-group v-model:value="ruleForm.requirementType" button-style="solid">
                    <a-radio-button value="mandatory">必须包含</a-radio-button>
                    <a-radio-button value="optional">建议包含</a-radio-button>
                  </a-radio-group>
                </a-form-item>
                <a-form-item label="规则描述/建议">
                  <a-textarea v-model:value="ruleForm.description" :rows="3" placeholder="描述该章节的具体编制要求..." />
                </a-form-item>
                <a-button type="primary" block @click="handleAddRule" :icon="h(PlusOutlined)">添加新规则</a-button>
              </a-form>
            </a-card>
            <div class="mt-4 p-4 bg-blue-50 rounded text-xs text-blue-600 flex gap-2">
              <InfoCircleOutlined class="mt-0.5" />
              <div>
                添加的规则将直接影响“编制工作台”中的“智能审查”功能，AI会根据这些规则对文档内容进行合规性检查。
              </div>
            </div>
          </div>
          <div class="lg:col-span-3">
            <a-table :columns="[
              { title: '类型', dataIndex: 'docType', width: 80 },
              { title: '章节', dataIndex: 'sectionName', width: 150 },
              { title: '要求', dataIndex: 'requirementType', width: 100 },
              { title: '描述', dataIndex: 'description', ellipsis: true },
              { title: '操作', key: 'action', width: 120 }
            ]" :data-source="rules" size="small" row-key="id" :loading="loading">
               <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'requirementType'">
                    <a-tag :color="record.requirementType === 'mandatory' ? 'red' : 'orange'">
                      {{ record.requirementType === 'mandatory' ? '强制' : '可选' }}
                    </a-tag>
                  </template>
                  <template v-if="column.key === 'action'">
                    <div class="flex gap-2">
                      <a-button type="link" size="small" @click="openEditRule(record)">
                        <template #icon><EditOutlined /></template>
                      </a-button>
                      <a-button type="link" danger size="small" @click="handleDeleteRule(record.id)">
                        <template #icon><DeleteOutlined /></template>
                      </a-button>
                    </div>
                  </template>
               </template>
            </a-table>
          </div>
        </div>
      </a-tab-pane>

      <a-tab-pane key="terms" tab="术语基线">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div class="lg:col-span-1">
            <a-card title="添加术语规范" size="small" :bordered="false" class="bg-gray-50">
              <a-form layout="vertical">
                <a-form-item label="标准术语">
                  <a-input v-model:value="termForm.standardName" placeholder="例如：模块" />
                </a-form-item>
                <a-form-item label="禁用/替代词">
                  <a-input v-model:value="termForm.forbiddenTerms" placeholder="用逗号分隔，例如：组件, 单元" />
                </a-form-item>
                <a-form-item label="规范说明">
                  <a-textarea v-model:value="termForm.description" :rows="2" placeholder="说明该术语的使用场景..." />
                </a-form-item>
                <a-button type="primary" block @click="handleAddTerm" :icon="h(PlusOutlined)">保存术语</a-button>
              </a-form>
            </a-card>
            <div class="mt-4 p-4 bg-green-50 rounded text-xs text-green-600 flex gap-2">
              <InfoCircleOutlined class="mt-0.5" />
              <div>
                术语库用于统一文档用词。AI在生成和审查时会优先使用“标准术语”，并提示修改“禁用词”。
              </div>
            </div>
          </div>
          <div class="lg:col-span-3">
            <a-table :columns="[
              { title: '标准名', dataIndex: 'standardName', width: 120 },
              { title: '禁用词', dataIndex: 'forbiddenTerms', width: 200 },
              { title: '说明', dataIndex: 'description', ellipsis: true },
              { title: '操作', key: 'action', width: 120 }
            ]" :data-source="terms" size="small" row-key="id" :loading="loading">
               <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'action'">
                    <div class="flex gap-2">
                      <a-button type="link" size="small" @click="openEditTerm(record)">
                        <template #icon><EditOutlined /></template>
                      </a-button>
                      <a-button type="link" danger size="small" @click="handleDeleteTerm(record.id)">
                        <template #icon><DeleteOutlined /></template>
                      </a-button>
                    </div>
                  </template>
               </template>
            </a-table>
          </div>
        </div>
      </a-tab-pane>
    </a-tabs>

    <!-- 编辑 Modal -->
    <a-modal v-model:open="editModalVisible" :title="editType === 'rule' ? '编辑规则' : '编辑术语'" @ok="handleEditSave">
      <a-form v-if="editType === 'rule'" layout="vertical">
        <a-form-item label="文档类型">
          <a-select v-model:value="ruleForm.docType">
            <a-select-option value="SRS">软件需求规格说明 (SRS)</a-select-option>
            <a-select-option value="SDD">软件设计说明 (SDD)</a-select-option>
            <a-select-option value="STP">软件测试计划 (STP)</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="章节名称">
          <a-input v-model:value="ruleForm.sectionName" />
        </a-form-item>
        <a-form-item label="要求类型">
          <a-radio-group v-model:value="ruleForm.requirementType" button-style="solid">
            <a-radio-button value="mandatory">必须包含</a-radio-button>
            <a-radio-button value="optional">建议包含</a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="规则描述/建议">
          <a-textarea v-model:value="ruleForm.description" :rows="4" />
        </a-form-item>
      </a-form>
      <a-form v-else layout="vertical">
        <a-form-item label="标准名">
          <a-input v-model:value="termForm.standardName" />
        </a-form-item>
        <a-form-item label="禁用词">
          <a-input v-model:value="termForm.forbiddenTerms" />
        </a-form-item>
        <a-form-item label="说明">
          <a-textarea v-model:value="termForm.description" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
