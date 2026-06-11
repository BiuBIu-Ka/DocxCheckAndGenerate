import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Antd from 'ant-design-vue'
import IssueTable from '@/components/IssueTable.vue'

const issues = [
  {
    id: '1',
    title: '缺少章节',
    severity: 'high' as const,
    rule: 'GJB-REQ-001',
    suggestion: '补齐概述章节',
    location: '第 1 章',
    status: 'open' as const,
  },
]

describe('IssueTable', () => {
  it('renders issue content', () => {
    const wrapper = mount(IssueTable, {
      props: { issues },
      global: { plugins: [Antd] },
    })

    expect(wrapper.text()).toContain('缺少章节')
    expect(wrapper.text()).toContain('GJB-REQ-001')
  })
})
