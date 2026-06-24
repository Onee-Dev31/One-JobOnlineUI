import { useState } from 'react'
import { Table, Input, Select, Card, Tag } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import api from '../services/api'
import styles from './Departments.module.css'

interface Department {
  COSTCENT: string
  NAMECOSTCENT: string
  COMCODE: string
  COMNAME: string
}

const comCodeColor: Record<string, string> = {
  GTH: 'blue',
  OTD: 'green',
  OTV: 'purple',
}

const columns: ColumnsType<Department> = [
  {
    title: 'รหัสแผนก',
    dataIndex: 'COSTCENT',
    key: 'COSTCENT',
    width: 120,
    render: (code: string) => <code>{code}</code>,
  },
  {
    title: 'ชื่อแผนก',
    dataIndex: 'NAMECOSTCENT',
    key: 'NAMECOSTCENT',
    render: (name: string) => <span className={styles.deptName}>{name}</span>,
  },
  {
    title: 'บริษัท',
    key: 'company',
    render: (_, r) => (
      <div>
        <Tag color={comCodeColor[r.COMCODE] ?? 'default'}>{r.COMCODE}</Tag>
        <span className={styles.comName}>{r.COMNAME}</span>
      </div>
    ),
  },
]

export default function Departments() {
  const [search, setSearch] = useState('')
  const [comFilter, setComFilter] = useState<string | undefined>()

  const { data = [], isPending } = useQuery<Department[]>({
    queryKey: ['/api/Department/GetDepartment'],
    queryFn: () => api.get('/api/Department/GetDepartment').then((r) => r.data),
  })

  const comOptions = [...new Set(data.map((d) => d.COMCODE))].map((c) => ({
    value: c,
    label: c,
  }))

  const filtered = data.filter((d) => {
    const matchSearch =
      d.NAMECOSTCENT.toLowerCase().includes(search.toLowerCase()) ||
      d.COSTCENT.includes(search)
    const matchCom = !comFilter || d.COMCODE === comFilter
    return matchSearch && matchCom
  })

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>แผนก ({data.length})</div>
        <div className={styles.toolbar}>
          <Select
            className={styles.filterSelect}
            placeholder="กรองบริษัท"
            allowClear
            value={comFilter}
            onChange={setComFilter}
            options={comOptions}
          />
          <Input
            prefix={<SearchOutlined />}
            placeholder="ค้นหาชื่อแผนก / รหัส"
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
          rowKey="COSTCENT"
          loading={isPending}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          size="middle"
        />
      </Card>
    </div>
  )
}
