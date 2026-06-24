import { Button, Spin, Tag } from 'antd'
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  BankOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import api from '../../services/api'
import styles from './JobPublicDetail.module.css'

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
  closingDate: string
  postedDate: string
}

export default function JobPublicDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: job, isPending } = useQuery<Job>({
    queryKey: ['/api/Jobs/public', id],
    queryFn: () => api.get(`/api/Jobs/${id}`).then((r) => r.data),
  })

  if (isPending) {
    return (
      <div className={styles.center}>
        <Spin size="large" />
      </div>
    )
  }

  if (!job) return null

  const isClosed = job.jobStatus !== 'Open'
  const handleApply = () => navigate(`/app/apply/${job.jobID}`)

  return (
    <div className={styles.page}>
      <button type="button" className={styles.backLink} onClick={() => navigate('/app/jobs')}>
        <ArrowLeftOutlined /> กลับหน้ารายการงาน
      </button>

      {/* Dark hero header */}
      <div className={styles.headerCard}>
        <div className={styles.headerEyebrow}>{job.departmentName}</div>

        <div className={styles.headerTop}>
          <div className={styles.jobTitle}>{job.jobTitle}</div>
          <Tag color={isClosed ? 'error' : 'success'} className={styles.statusTag}>
            {isClosed ? 'ปิดรับสมัครแล้ว' : 'เปิดรับสมัคร'}
          </Tag>
        </div>

        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <BankOutlined className={styles.metaIcon} />
            {job.departmentName}
          </div>
          <div className={styles.metaItem}>
            <EnvironmentOutlined className={styles.metaIcon} />
            {job.location}
          </div>
          <div className={styles.metaItem}>
            <ClockCircleOutlined className={styles.metaIcon} />
            ประสบการณ์ {job.experienceYears} ปี
          </div>
          <div className={styles.metaItem}>
            <TeamOutlined className={styles.metaIcon} />
            {job.numberOfPositions} อัตรา
          </div>
          <div className={styles.metaItem}>
            <CalendarOutlined className={styles.metaIcon} />
            ปิดรับ {dayjs(job.closingDate).format('DD MMM YYYY')}
          </div>
        </div>

        {!isClosed && (
          <div className={styles.applyBtnWrap}>
            <Button className={styles.applyBtn} onClick={handleApply}>
              สมัครงานตำแหน่งนี้ →
            </Button>
          </div>
        )}
      </div>

      {/* 2-column body */}
      <div className={styles.body}>
        {/* Main */}
        <div className={styles.main}>
          <div className={styles.section}>
            <div className={styles.sectionTitle}>รายละเอียดงาน</div>
            <pre className={styles.preText}>{job.jobDescription}</pre>
          </div>

          <div className={styles.section}>
            <div className={styles.sectionTitle}>คุณสมบัติที่ต้องการ</div>
            <pre className={styles.preText}>{job.requirements}</pre>
          </div>
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          {/* Apply CTA */}
          <div className={`${styles.sideCard} ${styles.sideCardApply}`}>
            {isClosed ? (
              <div className={styles.closedBadge}>ปิดรับสมัครแล้ว</div>
            ) : (
              <>
                <div className={styles.sideApplyTitle}>สนใจตำแหน่งนี้?</div>
                <div className={styles.sideApplySub}>
                  สมัครได้เลย กระบวนการรวดเร็วและใช้เวลาไม่นาน
                </div>
                <Button className={styles.sideApplyBtn} onClick={handleApply}>
                  สมัครงานเลย
                </Button>
              </>
            )}
          </div>

          {/* Job info */}
          <div className={styles.sideCard}>
            <div className={styles.sideTitle}>ข้อมูลตำแหน่ง</div>
            {[
              { key: 'แผนก', val: job.departmentName },
              { key: 'สถานที่', val: job.location },
              { key: 'ประสบการณ์', val: `${job.experienceYears} ปี` },
              { key: 'จำนวนอัตรา', val: `${job.numberOfPositions} อัตรา` },
              { key: 'วันที่ประกาศ', val: dayjs(job.postedDate).format('DD MMM YYYY') },
              { key: 'วันปิดรับ', val: dayjs(job.closingDate).format('DD MMM YYYY') },
            ].map(({ key, val }) => (
              <div className={styles.sideRow} key={key}>
                <span className={styles.sideKey}>{key}</span>
                <span className={styles.sideVal}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
