import { useState } from 'react'
import { Table, Tag, Input, Card } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import api from '../services/api'
import styles from './Jobs.module.css'

interface Job {
  jobID: number
  jobTitle: string
  departmentName: string
  jobStatus: string
  approvalStatus: string
  applicantCount: number
  numberOfPositions: number
  experienceYears: string
  postedDate: string
  closingDate: string
  namethai: string
}

const jobStatusColor: Record<string, string> = {
  Open: 'green',
  Closed: 'red',
  Draft: 'default',
}

const approvalColor: Record<string, string> = {
  Approved: 'green',
  'Waiting HR Approve': 'orange',
  Rejected: 'red',
}

const columns: ColumnsType<Job> = [
  {
    title: 'ตำแหน่งงาน',
    dataIndex: 'jobTitle',
    key: 'jobTitle',
    render: (title: string, record) => (
      <div>
        <div className={styles.jobTitle}>{title}</div>
        <div className={styles.jobMeta}>
          {record.departmentName} · ประสบการณ์ {record.experienceYears} ปี · {record.numberOfPositions} อัตรา
        </div>
      </div>
    ),
  },
  {
    title: 'สถานะงาน',
    dataIndex: 'jobStatus',
    key: 'jobStatus',
    width: 110,
    render: (status: string) => (
      <Tag color={jobStatusColor[status] ?? 'default'}>{status}</Tag>
    ),
  },
  {
    title: 'สถานะอนุมัติ',
    dataIndex: 'approvalStatus',
    key: 'approvalStatus',
    width: 180,
    render: (status: string) => (
      <Tag color={approvalColor[status] ?? 'default'}>{status}</Tag>
    ),
  },
  {
    title: 'ผู้สมัคร',
    dataIndex: 'applicantCount',
    key: 'applicantCount',
    width: 90,
    align: 'center',
    render: (count: number) => <strong>{count}</strong>,
  },
  {
    title: 'วันปิดรับ',
    dataIndex: 'closingDate',
    key: 'closingDate',
    width: 120,
    render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
  },
  {
    title: 'ผู้สร้าง',
    dataIndex: 'namethai',
    key: 'namethai',
    width: 150,
  },
]

export default function Jobs() {
  const [search, setSearch] = useState('')

  const { data = [], isPending } = useQuery<Job[]>({
    queryKey: ['/api/Jobs'],
    queryFn: () => api.get('/api/Jobs').then((r) => r.data),
  })

  const filtered = data.filter((j) =>
    j.jobTitle.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>รายการงาน ({data.length})</div>
        <div className={styles.toolbar}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="ค้นหาตำแหน่งงาน"
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="jobID"
          loading={isPending}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          size="middle"
        />
      </Card>
    </div>
  )
}
