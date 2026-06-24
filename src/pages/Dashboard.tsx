import { Card, Col, Row, Spin } from 'antd'
import {
  FileTextOutlined,
  TeamOutlined,
  UserOutlined,
  BankOutlined,
} from '@ant-design/icons'
import { useQueries } from '@tanstack/react-query'
import api from '../services/api'
import styles from './Dashboard.module.css'

const statConfig = [
  { label: 'งานทั้งหมด', icon: <FileTextOutlined />, iconClass: styles.iconBlue, endpoint: '/api/Jobs' },
  { label: 'ผู้สมัคร', icon: <TeamOutlined />, iconClass: styles.iconGreen, endpoint: '/api/ApplicantNew/applicant' },
  { label: 'Admin Users', icon: <UserOutlined />, iconClass: styles.iconOrange, endpoint: '/api/AdminUsers' },
  { label: 'แผนก', icon: <BankOutlined />, iconClass: styles.iconPurple, endpoint: '/api/Department/GetDepartment' },
]

export default function Dashboard() {
  const results = useQueries({
    queries: statConfig.map((s) => ({
      queryKey: [s.endpoint],
      queryFn: () => api.get(s.endpoint).then((r) => r.data),
    })),
  })

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitle}>Dashboard</div>
        <div className={styles.pageSubtitle}>ภาพรวมระบบ</div>
      </div>

      <Row gutter={[16, 16]}>
        {statConfig.map((s, i) => {
          const { data, isPending, isError } = results[i]
          const count = Array.isArray(data) ? data.length : '—'

          return (
            <Col xs={24} sm={12} lg={6} key={s.label}>
              <Card className={styles.statCard}>
                <div className={styles.statInner}>
                  <div className={`${styles.statIcon} ${s.iconClass}`}>{s.icon}</div>
                  <div className={styles.statBody}>
                    <div className={styles.statValue}>
                      {isPending ? <Spin size="small" /> : isError ? '—' : count}
                    </div>
                    <div className={styles.statLabel}>{s.label}</div>
                  </div>
                </div>
              </Card>
            </Col>
          )
        })}
      </Row>
    </div>
  )
}
