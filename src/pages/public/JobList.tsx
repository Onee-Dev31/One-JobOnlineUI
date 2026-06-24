import { useState } from 'react'
import { Input, Select, Button, Spin } from 'antd'
import {
  SearchOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import api from '../../services/api'
import styles from './JobList.module.css'

interface Job {
  jobID: number
  jobTitle: string
  departmentName: string
  location: string
  experienceYears: string
  numberOfPositions: number
  jobStatus: string
  closingDate: string
  applicantCount: number
}

export default function JobList() {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState<string | undefined>()
  const navigate = useNavigate()

  const { data = [], isPending } = useQuery<Job[]>({
    queryKey: ['/api/Jobs/public'],
    queryFn: () => api.get('/api/Jobs').then((r) => r.data),
  })

  const openJobs = data.filter((j) => j.jobStatus === 'Open')
  const deptSet = [...new Set(openJobs.map((j) => j.departmentName))]
  const deptOptions = deptSet.map((d) => ({ value: d, label: d }))

  const filtered = openJobs.filter((j) => {
    const matchSearch =
      j.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      j.departmentName.toLowerCase().includes(search.toLowerCase())
    const matchDept = !deptFilter || j.departmentName === deptFilter
    return matchSearch && matchDept
  })

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          กำลังเปิดรับสมัคร
        </div>

        <div className={styles.heroTitle}>
          ร่วมสร้างอนาคตของ<br />
          <em>Content &amp; Distribution</em>
        </div>
        <div className={styles.heroSub}>
          The One Enterprise — ผู้นำด้านการผลิตและกระจายคอนเทนต์ระดับประเทศ<br />
          ค้นหาตำแหน่งที่ใช่ และเติบโตไปด้วยกัน
        </div>

        <div className={styles.searchRow}>
          <div className={styles.searchWrap}>
            <SearchOutlined className={styles.searchIcon} />
            <Input
              className={styles.searchInput}
              placeholder="ค้นหาตำแหน่งงาน หรือแผนก..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </div>
        </div>

        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatNum}>{isPending ? '—' : openJobs.length}</span>
            <span className={styles.heroStatLabel}>ตำแหน่งที่เปิดรับ</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStat}>
            <span className={styles.heroStatNum}>{isPending ? '—' : deptSet.length}</span>
            <span className={styles.heroStatLabel}>แผนกทั้งหมด</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <span className={styles.toolbarLabel}>กรองตาม</span>
        <Select
          className={styles.filterSelect}
          placeholder="แผนก"
          allowClear
          value={deptFilter}
          onChange={setDeptFilter}
          options={deptOptions}
        />
        <span className={styles.resultCount}>
          {!isPending && `แสดง ${filtered.length} จาก ${openJobs.length} ตำแหน่ง`}
        </span>
      </div>

      {/* Grid */}
      {isPending ? (
        <div className={styles.empty}>
          <Spin size="large" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>ไม่พบตำแหน่งงานที่ตรงกับการค้นหา</div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((job) => (
            <div
              key={job.jobID}
              className={styles.card}
              onClick={() => navigate(`/app/jobs/${job.jobID}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/app/jobs/${job.jobID}`)}
            >
              <div className={styles.cardBody}>
                <div className={styles.cardHeader}>
                  <div className={styles.deptIcon}>
                    {job.departmentName.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.cardHeaderText}>
                    <div className={styles.cardDept}>{job.departmentName}</div>
                    <div className={styles.jobTitle}>{job.jobTitle}</div>
                  </div>
                </div>

                <div className={styles.metaList}>
                  <div className={styles.metaRow}>
                    <EnvironmentOutlined className={styles.metaIcon} />
                    {job.location}
                  </div>
                  <div className={styles.metaRow}>
                    <ClockCircleOutlined className={styles.metaIcon} />
                    ประสบการณ์ {job.experienceYears} ปี
                  </div>
                  <div className={styles.metaRow}>
                    <TeamOutlined className={styles.metaIcon} />
                    {job.numberOfPositions} อัตรา
                  </div>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.closing}>
                  <CalendarOutlined />
                  ปิดรับ {dayjs(job.closingDate).format('DD MMM YYYY')}
                </span>
                <Button
                  className={styles.arrowBtn}
                  icon={<ArrowRightOutlined />}
                  onClick={(e) => { e.stopPropagation(); navigate(`/app/jobs/${job.jobID}`) }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
