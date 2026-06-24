import { useState } from 'react'
import { Table, Tag, Input, Select, Card, App } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import api from '../services/api'
import { STATUS_OPTIONS, STATUS_COLOR, EMAIL_TRIGGER_TYPES } from '../constants/applicantStatus'
import styles from './Applicants.module.css'

interface Applicant {
  ApplicantID: number
  FirstNameThai: string
  LastNameThai: string
  Email: string
  MobilePhone: string
  JobTitle: string
  Status: string
  SubmissionDate: string
}

export default function Applicants() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const { message, modal } = App.useApp()
  const queryClient = useQueryClient()

  const { data = [], isPending } = useQuery<Applicant[]>({
    queryKey: ['/api/ApplicantNew/applicant'],
    queryFn: () => api.get('/api/ApplicantNew/applicant').then((r) => r.data),
  })

  const { mutate: updateStatus, isPending: isUpdating } = useMutation({
    mutationFn: (payload: { ApplicantID: number; Status: string; TypeMail: string }) =>
      api.put('/api/ApplicantNew/updateApplicantStatus', payload),
    onSuccess: () => {
      message.success('อัปเดตสถานะสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['/api/ApplicantNew/applicant'] })
    },
    onError: () => message.error('อัปเดตสถานะไม่สำเร็จ'),
  })

  const handleStatusChange = (applicantID: number, newStatus: string) => {
    const doUpdate = () => updateStatus({ ApplicantID: applicantID, Status: newStatus, TypeMail: newStatus })

    if (EMAIL_TRIGGER_TYPES.has(newStatus)) {
      modal.confirm({
        title: 'การเปลี่ยนสถานะนี้จะส่ง Email',
        content: `สถานะ "${newStatus}" จะส่ง email แจ้งอัตโนมัติ ต้องการดำเนินการต่อไหม?`,
        okText: 'ยืนยัน ส่ง Email',
        cancelText: 'ยกเลิก',
        onOk: doUpdate,
      })
    } else {
      doUpdate()
    }
  }

  const filtered = data.filter((a) => {
    const fullName = `${a.FirstNameThai} ${a.LastNameThai}`.toLowerCase()
    const matchSearch =
      fullName.includes(search.toLowerCase()) ||
      a.Email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || a.Status === statusFilter
    return matchSearch && matchStatus
  })

  const columns: ColumnsType<Applicant> = [
    {
      title: 'ชื่อ-นามสกุล',
      key: 'name',
      render: (_, record) => (
        <div>
          <div className={styles.name}>{record.FirstNameThai} {record.LastNameThai}</div>
          <div className={styles.sub}>{record.Email} · {record.MobilePhone}</div>
        </div>
      ),
    },
    {
      title: 'ตำแหน่งงานที่สมัคร',
      dataIndex: 'JobTitle',
      key: 'JobTitle',
    },
    {
      title: 'สถานะ',
      dataIndex: 'Status',
      key: 'Status',
      width: 200,
      render: (status: string, record) => (
        <Select
          value={status}
          size="small"
          className={styles.statusSelect}
          disabled={isUpdating}
          onChange={(val) => handleStatusChange(record.ApplicantID, val)}
          options={STATUS_OPTIONS.map((s) => ({
            value: s,
            label: <Tag color={STATUS_COLOR[s] ?? 'default'}>{s}</Tag>,
          }))}
        />
      ),
    },
    {
      title: 'วันที่สมัคร',
      dataIndex: 'SubmissionDate',
      key: 'SubmissionDate',
      width: 130,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>ผู้สมัคร ({data.length})</div>
        <div className={styles.toolbar}>
          <Select
            className={styles.filterSelect}
            placeholder="กรองตามสถานะ"
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
          />
          <Input
            prefix={<SearchOutlined />}
            placeholder="ค้นหาชื่อ / Email"
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
          rowKey="ApplicantID"
          loading={isPending}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          size="middle"
        />
      </Card>
    </div>
  )
}
