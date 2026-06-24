import { Table, Tag, Card, Button, Spin, Divider, Select, App } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import api from '../services/api'
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
const statusColor: Record<string, string> = {
  'Waiting HR Approve': 'orange',
  'Waiting candidate Info': 'orange',
  'Waiting HR Re-check': 'orange',
  Favorite: 'gold',
  'Nagotiate Process': 'blue',
  'Nagotiate Success': 'cyan',
  'Nagotiate Failed': 'red',
  'Nagotiate Cancel': 'default',
  'Employment confirm': 'green',
  Reject: 'red',
}

const STATUS_OPTIONS = [
  'Waiting HR Approve',
  'Waiting candidate Info',
  'Waiting HR Re-check',
  'Favorite',
  'Nagotiate Process',
  'Nagotiate Success',
  'Nagotiate Failed',
  'Nagotiate Cancel',
  'Employment confirm',
  'Reject',
]

export default function JobDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const queryClient = useQueryClient()

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
    mutationFn: (payload: { ApplicantID: number; Status: string; TypeMail: string }) =>
      api.put('/api/ApplicantNew/updateApplicantStatus', payload),
    onSuccess: () => {
      message.success('อัปเดตสถานะสำเร็จ')
      queryClient.invalidateQueries({ queryKey: ['/api/ApplicantNew/GetCandidateForJobs', id] })
    },
    onError: () => message.error('อัปเดตสถานะไม่สำเร็จ'),
  })

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
          onChange={(val) => updateStatus({ ApplicantID: record.ApplicantID, Status: val, TypeMail: val })}
          options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
        />
      ),
    },
    {
      title: 'สถานะ (Tag)',
      dataIndex: 'Status',
      key: 'statusTag',
      width: 160,
      render: (status: string) => (
        <Tag color={statusColor[status] ?? 'default'}>{status}</Tag>
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
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Left: description + requirements */}
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

        {/* Right: meta */}
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
        <div className={styles.sectionLabel}>ผู้สมัคร ({candidates.length} คน)</div>
        <Divider style={{ margin: '8px 0 16px' }} />
        <Table
          columns={candidateColumns}
          dataSource={candidates}
          rowKey="ApplicantID"
          loading={candLoading}
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  )
}
