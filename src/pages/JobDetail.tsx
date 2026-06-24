import { useState } from 'react'
import { Table, Tag, Card, Button, Spin, Divider, Select, Modal, Form, Input, App } from 'antd'
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import api from '../services/api'
import { STATUS_OPTIONS, STATUS_COLOR, EMAIL_TRIGGER_TYPES } from '../constants/applicantStatus'
import styles from './JobDetail.module.css'

interface Job {
  jobID: number
  jobTitle: string
  jobDescription: string
  requirements: string
  location: string
  experienceYears: string
  numberOfPositions: number
  departmentName: string
  jobStatus: string
  approvalStatus: string
  applicantCount: number
  postedDate: string
  closingDate: string
  namethai: string
  remark: string
}

interface Candidate {
  ApplicantID: number
  FirstNameThai: string
  LastNameThai: string
  TitleENG: string
  Email: string
  MobilePhone: string
  Status: string
  InterviewDate: string | null
  RankOfSelect: number | null
}

const jobStatusColor: Record<string, string> = { Open: 'green', Closed: 'red', Draft: 'default' }
const approvalColor: Record<string, string> = {
  Approved: 'green',
  'Waiting HR Approve': 'orange',
  Rejected: 'red',
}

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const queryClient = useQueryClient()

  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([])
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<string | undefined>()

  const [approvalAction, setApprovalAction] = useState<'Approved' | 'Rejected' | null>(null)
  const [approvalForm] = Form.useForm()

  const invalidateCandidates = () =>
    queryClient.invalidateQueries({ queryKey: ['/api/ApplicantNew/GetCandidateForJobs', id] })
  const invalidateJob = () =>
    queryClient.invalidateQueries({ queryKey: ['/api/Jobs', id] })

  const { data: job, isPending: jobLoading } = useQuery<Job>({
    queryKey: ['/api/Jobs', id],
    queryFn: () => api.get(`/api/Jobs/${id}`).then((r) => r.data),
  })

  const { data: candidates = [], isPending: candLoading } = useQuery<Candidate[]>({
    queryKey: ['/api/ApplicantNew/GetCandidateForJobs', id],
    queryFn: () =>
      api.get(`/api/ApplicantNew/GetCandidateForJobs?jobId=${id}`).then((r) => r.data),
  })

  const { mutate: updateStatus } = useMutation({
    mutationFn: (payload: object) => api.put('/api/ApplicantNew/updateApplicantStatus', payload),
    onSuccess: () => { message.success('อัปเดตสถานะสำเร็จ'); invalidateCandidates() },
    onError: () => message.error('อัปเดตสถานะไม่สำเร็จ'),
  })

  const { mutate: approveJob, isPending: isApproving } = useMutation({
    mutationFn: (payload: { JobID: number; ApprovalStatus: string; Remark: string }) =>
      api.put('/api/ApplicantNew/updateJobApprovalStatus', payload),
    onSuccess: () => {
      message.success(approvalAction === 'Approved' ? 'อนุมัติงานสำเร็จ' : 'ปฏิเสธงานสำเร็จ')
      invalidateJob()
      setApprovalAction(null)
      approvalForm.resetFields()
    },
    onError: () => message.error('ดำเนินการไม่สำเร็จ'),
  })

  const handleStatusChange = (applicantID: number, newStatus: string) => {
    const doUpdate = () =>
      updateStatus({ ApplicantID: applicantID, Status: newStatus, TypeMail: newStatus })

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

  const handleBulkUpdate = () => {
    if (!bulkStatus || selectedRowKeys.length === 0) return
    const doUpdate = () => {
      updateStatus({
        Status: bulkStatus,
        TypeMail: 'Selected',
        IsBatch: 'true',
        JobID: Number(id),
        Candidates: selectedRowKeys.map((aid) => ({ ApplicantID: aid })),
      })
      setBulkModalOpen(false)
      setBulkStatus(undefined)
      setSelectedRowKeys([])
    }

    if (EMAIL_TRIGGER_TYPES.has(bulkStatus)) {
      modal.confirm({
        title: 'Bulk Update นี้จะส่ง Email',
        content: `สถานะ "${bulkStatus}" จะส่ง email แจ้ง ${selectedRowKeys.length} คน ต้องการดำเนินการต่อไหม?`,
        okText: 'ยืนยัน ส่ง Email',
        cancelText: 'ยกเลิก',
        onOk: doUpdate,
      })
    } else {
      doUpdate()
    }
  }

  const handleApprovalSubmit = (values: { Remark: string }) => {
    if (!job || !approvalAction) return
    approveJob({ JobID: job.jobID, ApprovalStatus: approvalAction, Remark: values.Remark ?? '' })
  }

  const candidateColumns: ColumnsType<Candidate> = [
    {
      title: 'ผู้สมัคร',
      key: 'name',
      render: (_, r) => (
        <div>
          <div className={styles.candidateName}>
            {r.TitleENG} {r.FirstNameThai} {r.LastNameThai}
          </div>
          <div className={styles.candidateSub}>{r.Email} · {r.MobilePhone}</div>
        </div>
      ),
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
          aria-label="เลือกสถานะผู้สมัคร"
          onChange={(val) => handleStatusChange(record.ApplicantID, val)}
          options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
        />
      ),
    },
    {
      title: '',
      dataIndex: 'Status',
      key: 'statusTag',
      width: 160,
      render: (status: string) => (
        <Tag color={STATUS_COLOR[status] ?? 'default'}>{status}</Tag>
      ),
    },
    {
      title: 'นัดสัมภาษณ์',
      dataIndex: 'InterviewDate',
      key: 'InterviewDate',
      width: 130,
      render: (date: string | null) => date ? dayjs(date).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'ลำดับ',
      dataIndex: 'RankOfSelect',
      key: 'RankOfSelect',
      width: 70,
      align: 'center',
      render: (rank: number | null) => rank ?? '—',
    },
  ]

  if (jobLoading) {
    return (
      <div className={styles.loadingWrap}>
        <Spin size="large" />
      </div>
    )
  }

  if (!job) return null

  return (
    <div className={styles.page}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        className={styles.backBtn}
        onClick={() => navigate('/jobs')}
      >
        กลับหน้ารายการงาน
      </Button>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleGroup}>
          <div className={styles.jobTitle}>{job.jobTitle}</div>
          <div className={styles.tagRow}>
            <Tag color={jobStatusColor[job.jobStatus] ?? 'default'}>{job.jobStatus}</Tag>
            <Tag color={approvalColor[job.approvalStatus] ?? 'default'}>{job.approvalStatus}</Tag>
          </div>
        </div>

        {job.approvalStatus === 'Waiting HR Approve' && (
          <div className={styles.approvalBtns}>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => setApprovalAction('Approved')}
            >
              อนุมัติ
            </Button>
            <Button
              danger
              icon={<CloseOutlined />}
              onClick={() => setApprovalAction('Rejected')}
            >
              ปฏิเสธ
            </Button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className={styles.body}>
        <div className={styles.leftCol}>
          <Card>
            <div className={styles.sectionLabel}>รายละเอียดงาน</div>
            <pre className={styles.preText}>{job.jobDescription}</pre>
          </Card>
          <Card>
            <div className={styles.sectionLabel}>คุณสมบัติที่ต้องการ</div>
            <pre className={styles.preText}>{job.requirements}</pre>
          </Card>
        </div>

        <Card>
          <div className={styles.metaRow}>
            {[
              { key: 'แผนก', val: job.departmentName },
              { key: 'สถานที่', val: job.location },
              { key: 'ประสบการณ์', val: `${job.experienceYears} ปี` },
              { key: 'จำนวนอัตรา', val: `${job.numberOfPositions} อัตรา` },
              { key: 'ผู้สมัคร', val: `${job.applicantCount} คน` },
              { key: 'วันประกาศ', val: dayjs(job.postedDate).format('DD/MM/YYYY') },
              { key: 'วันปิดรับ', val: dayjs(job.closingDate).format('DD/MM/YYYY') },
              { key: 'ผู้สร้าง', val: job.namethai },
              { key: 'หมายเหตุ', val: job.remark },
            ].map(({ key, val }) => (
              <div className={styles.metaItem} key={key}>
                <span className={styles.metaKey}>{key}</span>
                <span className={styles.metaVal}>{val}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Candidates */}
      <Card>
        <div className={styles.candidateHeader}>
          <div className={styles.sectionLabel}>ผู้สมัคร ({candidates.length} คน)</div>
          {selectedRowKeys.length > 0 && (
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={() => setBulkModalOpen(true)}
            >
              อัปเดตสถานะ ({selectedRowKeys.length} คน)
            </Button>
          )}
        </div>
        <Divider className={styles.divider} />
        <Table
          columns={candidateColumns}
          dataSource={candidates}
          rowKey="ApplicantID"
          loading={candLoading}
          pagination={false}
          size="middle"
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as number[]),
          }}
        />
      </Card>

      {/* Approval Modal */}
      <Modal
        title={approvalAction === 'Approved' ? 'อนุมัติงาน' : 'ปฏิเสธงาน'}
        open={approvalAction !== null}
        onCancel={() => { setApprovalAction(null); approvalForm.resetFields() }}
        onOk={() => approvalForm.submit()}
        okText={approvalAction === 'Approved' ? 'อนุมัติ' : 'ปฏิเสธ'}
        okButtonProps={{ danger: approvalAction === 'Rejected' }}
        cancelText="ยกเลิก"
        confirmLoading={isApproving}
        destroyOnHidden
      >
        <Form form={approvalForm} layout="vertical" onFinish={handleApprovalSubmit}>
          <Form.Item name="Remark" label="หมายเหตุ">
            <Input.TextArea rows={3} placeholder="ระบุหมายเหตุ (ถ้ามี)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Update Modal */}
      <Modal
        title="อัปเดตสถานะหลายคนพร้อมกัน"
        open={bulkModalOpen}
        onCancel={() => { setBulkModalOpen(false); setBulkStatus(undefined) }}
        onOk={handleBulkUpdate}
        okText="อัปเดต"
        cancelText="ยกเลิก"
        okButtonProps={{ disabled: !bulkStatus }}
        destroyOnHidden
      >
        <div className={styles.bulkInfo}>เลือกสถานะสำหรับ {selectedRowKeys.length} คน</div>
        <Select
          className={styles.bulkSelect}
          placeholder="เลือกสถานะ"
          value={bulkStatus}
          onChange={setBulkStatus}
          options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
        />
      </Modal>
    </div>
  )
}
