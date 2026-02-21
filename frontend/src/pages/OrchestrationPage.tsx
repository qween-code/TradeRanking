import { useState, useEffect, useRef } from 'react'
import TopBar from '../components/TopBar'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { orchestrationApi } from '../services/api'
import {
  Bot,
  Play,
  RotateCcw,
  XCircle,
  CheckCircle2,
  Clock,
  Loader2,
  AlertTriangle,
  Zap,
  FileSearch,
  Users,
  Mail,
  Inbox,
  ShieldCheck,
  BarChart3,
} from 'lucide-react'

interface JobItem {
  id: string
  job_type: string
  status: string
  rfq_id?: string
  supplier_id?: string
  progress: number
  current_agent?: string
  result?: Record<string, unknown>
  error?: string
  created_at: string
  updated_at: string
}

const agentSteps = [
  { key: 'rfq_intake', label: 'RFQ Intake', icon: FileSearch, desc: 'Validates and normalizes RFQ data' },
  { key: 'supplier_discovery', label: 'Supplier Discovery', icon: Users, desc: 'Finds and scores matching suppliers' },
  { key: 'email_send', label: 'Email Outreach', icon: Mail, desc: 'Sends RFQ invitations to suppliers' },
  { key: 'inbox_parser', label: 'Inbox Parser', icon: Inbox, desc: 'Parses and extracts supplier responses' },
  { key: 'supplier_verifier', label: 'Verification', icon: ShieldCheck, desc: 'Verifies credentials and pricing' },
  { key: 'aggregation_report', label: 'Aggregation', icon: BarChart3, desc: 'Ranks offers and generates reports' },
]

const jobTypeLabels: Record<string, string> = {
  full_pipeline: 'Full Pipeline',
  supplier_discovery: 'Supplier Discovery',
  risk_assessment: 'Risk Assessment',
  market_analysis: 'Market Analysis',
  negotiation: 'AI Negotiation',
}

export default function OrchestrationPage() {
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null)
  const [newJob, setNewJob] = useState({
    job_type: 'full_pipeline',
    rfq_id: '',
    supplier_id: '',
  })
  const pollRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    loadJobs()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const loadJobs = async () => {
    try {
      const res = await orchestrationApi.history({ limit: 20 })
      setJobs(res.data.data || res.data || [])
    } catch {
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const startJob = async () => {
    setStarting(true)
    try {
      const payload: { job_type: string; rfq_id?: string; supplier_id?: string } = { job_type: newJob.job_type }
      if (newJob.rfq_id) payload.rfq_id = newJob.rfq_id
      if (newJob.supplier_id) payload.supplier_id = newJob.supplier_id
      const res = await orchestrationApi.start(payload)
      const job = res.data.data || res.data
      setSelectedJob(job)
      setNewJob({ job_type: 'full_pipeline', rfq_id: '', supplier_id: '' })
      loadJobs()

      // Poll for status
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await orchestrationApi.status(job.id)
          const updated = statusRes.data.data || statusRes.data
          setSelectedJob(updated)
          if (['completed', 'failed', 'cancelled'].includes(updated.status)) {
            clearInterval(pollRef.current)
            loadJobs()
          }
        } catch {
          clearInterval(pollRef.current)
        }
      }, 2000)
    } catch {
      // Handle error
    } finally {
      setStarting(false)
    }
  }

  const cancelJob = async (id: string) => {
    try {
      await orchestrationApi.cancel(id)
      loadJobs()
      if (selectedJob?.id === id) setSelectedJob(null)
    } catch { /* */ }
  }

  const getStepStatus = (stepKey: string, currentAgent?: string, jobStatus?: string, progress?: number) => {
    if (jobStatus === 'completed') return 'completed'
    if (jobStatus === 'failed') {
      const stepIndex = agentSteps.findIndex((s) => s.key === stepKey)
      const currentIndex = agentSteps.findIndex((s) => s.key === currentAgent)
      if (stepIndex < currentIndex) return 'completed'
      if (stepIndex === currentIndex) return 'failed'
      return 'pending'
    }
    if (!currentAgent) return 'pending'
    const stepIndex = agentSteps.findIndex((s) => s.key === stepKey)
    const currentIndex = agentSteps.findIndex((s) => s.key === currentAgent)
    if (stepIndex < currentIndex) return 'completed'
    if (stepIndex === currentIndex) return 'active'
    return 'pending'
  }

  return (
    <div>
      <TopBar title="AI Pipeline" subtitle="6-agent orchestration engine with 3,247 parameters" />

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Launch & History */}
          <div className="lg:col-span-1 space-y-6">
            {/* Launch New Job */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary-600" />
                Launch Pipeline
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Job Type</label>
                  <select
                    value={newJob.job_type}
                    onChange={(e) => setNewJob({ ...newJob, job_type: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {Object.entries(jobTypeLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">RFQ ID (optional)</label>
                  <input
                    type="text"
                    value={newJob.rfq_id}
                    onChange={(e) => setNewJob({ ...newJob, rfq_id: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="Paste RFQ ID"
                  />
                </div>
                <button
                  onClick={startJob}
                  disabled={starting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {starting ? 'Starting...' : 'Start Pipeline'}
                </button>
              </div>
            </div>

            {/* Recent Jobs */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Job History</h3>
                <button onClick={loadJobs} className="p-1 hover:bg-gray-100 rounded-lg">
                  <RotateCcw className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : jobs.length === 0 ? (
                <div className="p-5 text-center text-sm text-gray-500">No jobs yet</div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                  {jobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => setSelectedJob(job)}
                      className={`w-full px-5 py-3 text-left hover:bg-gray-50 transition-colors ${
                        selectedJob?.id === job.id ? 'bg-primary-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {jobTypeLabels[job.job_type] || job.job_type}
                        </span>
                        <StatusBadge status={job.status} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(job.created_at).toLocaleString()}
                        </span>
                        {job.status === 'processing' && (
                          <span className="text-xs text-primary-600 font-medium">{job.progress}%</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Pipeline Visualization */}
          <div className="lg:col-span-2">
            {selectedJob ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {jobTypeLabels[selectedJob.job_type] || selectedJob.job_type}
                    </h3>
                    <p className="text-sm text-gray-500">Job ID: {selectedJob.id.slice(0, 12)}...</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selectedJob.status} size="md" />
                    {selectedJob.status === 'processing' && (
                      <button
                        onClick={() => cancelJob(selectedJob.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Progress</span>
                    <span className="text-sm font-medium text-gray-900">{selectedJob.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        selectedJob.status === 'failed' ? 'bg-red-500' : 'bg-primary-600'
                      }`}
                      style={{ width: `${selectedJob.progress}%` }}
                    />
                  </div>
                </div>

                {/* Agent Steps */}
                <div className="space-y-3">
                  {agentSteps.map((step) => {
                    const status = getStepStatus(step.key, selectedJob.current_agent, selectedJob.status, selectedJob.progress)
                    return (
                      <div
                        key={step.key}
                        className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                          status === 'active'
                            ? 'border-primary-300 bg-primary-50'
                            : status === 'completed'
                            ? 'border-green-200 bg-green-50'
                            : status === 'failed'
                            ? 'border-red-200 bg-red-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${
                          status === 'active' ? 'bg-primary-100' :
                          status === 'completed' ? 'bg-green-100' :
                          status === 'failed' ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          <step.icon className={`w-5 h-5 ${
                            status === 'active' ? 'text-primary-600' :
                            status === 'completed' ? 'text-green-600' :
                            status === 'failed' ? 'text-red-600' : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            status === 'active' ? 'text-primary-900' :
                            status === 'completed' ? 'text-green-900' :
                            status === 'failed' ? 'text-red-900' : 'text-gray-500'
                          }`}>
                            {step.label}
                          </p>
                          <p className="text-xs text-gray-500">{step.desc}</p>
                        </div>
                        <div>
                          {status === 'active' && <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />}
                          {status === 'completed' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                          {status === 'failed' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                          {status === 'pending' && <Clock className="w-5 h-5 text-gray-300" />}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Error */}
                {selectedJob.error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700 font-medium">Error</p>
                    <p className="text-xs text-red-600 mt-1">{selectedJob.error}</p>
                  </div>
                )}

                {/* Result Summary */}
                {selectedJob.result && selectedJob.status === 'completed' && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 font-medium">Pipeline Complete</p>
                    <p className="text-xs text-green-600 mt-1">
                      All 6 agents completed successfully. Results available in the RFQ dashboard.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-12">
                <EmptyState
                  icon={Bot}
                  title="Select or start a pipeline"
                  description="Choose a job from the history or launch a new AI pipeline to see the 6-agent orchestration in action."
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
