import {useState} from 'react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import {Card, CardBody, CardHeader} from '@/components/ui/Card'
import MetricCard from '@/components/evaluation/MetricCard'
import BarChart from '@/components/evaluation/BarChart'
import GaugeChart from '@/components/evaluation/GaugeChart'
import {useEvalReport, useRunEvaluation} from '@/hooks/useEvaluation'

const TABS = ['Overview', 'Per-Question', 'Comparison'] as const
type Tab = (typeof TABS)[number]

const CATEGORY_BADGE: Record<string, 'blue' | 'purple' | 'green' | 'yellow' | 'gray'> = {
    financial: 'blue',
    visual: 'purple',
    tabular: 'green',
    strategic: 'yellow',
    general: 'gray',
}

function ScoreChip({v}: {v: number | boolean}) {
    if (typeof v === 'boolean') {
        return (
            <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold ring-1 ${v ? 'bg-[var(--success-bg)] text-[var(--text-success)] ring-[var(--success)]/15' : 'bg-[#fef2f2] text-[var(--text-error)] ring-[var(--danger)]/15'
                    }`}
            >
                {v ? '✓ Yes' : '✗ No'}
            </span>
        )
    }
    const cls =
        v >= 0.8
            ? 'bg-[var(--success-bg)] text-[var(--text-success)] ring-[var(--success)]/15'
            : v >= 0.65
                ? 'bg-[var(--warning-bg)] text-[var(--text-warning)] ring-[var(--warning)]/15'
                : 'bg-[#fef2f2] text-[var(--text-error)] ring-[var(--danger)]/15'
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-bold ring-1 ${cls}`}>
            {v.toFixed(2)}
        </span>
    )
}

export default function EvaluationPage() {
    const [tab, setTab] = useState<Tab>('Overview')
    const {data: report, isLoading, isError} = useEvalReport()
    const {mutate: runEval, isPending: running} = useRunEvaluation()

    const m = report?.metrics

    return (
        <div className="h-full overflow-y-auto px-6 py-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="flex gap-1 bg-[var(--bg-tertiary)] p-1 rounded-xl border border-[var(--border-primary)] shadow-sm">
                    {TABS.map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 ${tab === t
                                ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm ring-1 ring-[var(--accent)]/10'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="primary"
                        loading={running}
                        onClick={() => runEval({top_k: 5, llm_provider: 'ollama'})}
                    >
                        ▶ Run Benchmark
                    </Button>
                    <Button variant="secondary">📥 Export Report</Button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-[140px] rounded-xl skeleton-shimmer" />
                    ))}
                </div>
            ) : isError || !m ? (
                <div className="text-center py-16">
                    <div className="icon-container w-16 h-16 rounded-2xl text-[28px] mx-auto mb-4" style={{background: 'linear-gradient(135deg, var(--accent-light), transparent)', color: 'var(--accent)', border: '1px solid var(--accent)', borderColor: 'rgba(59,130,246,0.15)'}}>
                        📉
                    </div>
                    <h3 className="text-[18px] font-bold text-[var(--text-primary)] mb-2 tracking-tight">No evaluation data yet</h3>
                    <p className="text-[14px] text-[var(--text-secondary)]">
                        Click "Run Benchmark" to evaluate your RAG pipeline.
                    </p>
                </div>
            ) : (
                <>
                    {/* Metric cards */}
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 mb-6">
                        <MetricCard icon="🎯" iconBg="var(--accent-light)" iconColor="var(--accent)" value={m.hit_at_k.toFixed(2)} label="Hit@5" delta={`↑ +0.04 from last run`} deltaDir="up" />
                        <MetricCard icon="📈" iconBg="var(--success-bg)" iconColor="var(--success)" value={m.mrr.toFixed(2)} label="MRR" delta={`↑ +0.03`} deltaDir="up" />
                        <MetricCard icon="🔬" iconBg="#f5f3ff" iconColor="var(--accent-secondary)" value={m.faithfulness.toFixed(2)} label="Faithfulness (RAGAS)" delta={`↑ +0.07`} deltaDir="up" />
                        <MetricCard icon="✅" iconBg="var(--warning-bg)" iconColor="var(--warning)" value={m.answer_relevancy.toFixed(2)} label="Answer Relevancy" delta={`↑ +0.02`} deltaDir="up" />
                        <MetricCard icon="🔍" iconBg="var(--info-bg)" iconColor="var(--info)" value={m.context_precision.toFixed(2)} label="Context Precision" delta={`↓ -0.01`} deltaDir="down" />
                        <MetricCard icon="⚠️" iconBg="#fef2f2" iconColor="var(--danger)" value={`${(m.hallucination_rate * 100).toFixed(1)}%`} label="Hallucination Rate" delta="↑ improved -1.3%" deltaDir="up" />
                    </div>

                    {/* Charts row */}
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 mb-6">
                        <Card>
                            <CardHeader title="Retrieval Metrics" action={<Badge variant="blue">{m.total_questions} questions</Badge>} />
                            <CardBody>
                                <BarChart
                                    data={[
                                        {label: 'Hit@5', value: m.hit_at_k, color: 'var(--chart-1)'},
                                        {label: 'MRR', value: m.mrr, color: 'var(--chart-2)'},
                                        {label: 'Recall@5', value: m.recall_at_k, color: 'var(--chart-3)'},
                                        {label: 'P@5', value: m.precision_at_k, color: 'var(--chart-4)'},
                                    ]}
                                />
                            </CardBody>
                        </Card>

                        <Card>
                            <CardHeader title="Generation Quality (RAGAS)" action={<Badge variant="purple">GPT-4o-mini</Badge>} />
                            <CardBody>
                                <div className="flex justify-around flex-wrap gap-3">
                                    <GaugeChart value={m.faithfulness} label="Faithful" color="var(--chart-1)" size={100} />
                                    <GaugeChart value={m.answer_relevancy} label="Relevant" color="var(--chart-2)" size={100} />
                                    <GaugeChart value={m.context_precision} label="Context" color="var(--chart-4)" size={100} />
                                </div>
                            </CardBody>
                        </Card>
                    </div>

                    {/* LLM comparison table */}
                    <Card className="mb-6">
                        <CardHeader title="LLM Provider Comparison" />
                        <CardBody noPadding>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr>
                                            {['Metric', 'Ollama (Mistral 7B)', 'OpenAI (GPT-4o-mini)', 'Delta'].map((h) => (
                                                <th key={h} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[0.5px] text-[var(--text-tertiary)] bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            ['Hit@5', '0.82', '0.82', '0.00', 'neutral'],
                                            ['MRR', '0.65', '0.68', '+0.03', 'up'],
                                            ['Faithfulness', '0.72', '0.85', '+0.13', 'up'],
                                            ['Answer Relevance', '0.70', '0.80', '+0.10', 'up'],
                                            ['Context Precision', '0.78', '0.78', '0.00', 'neutral'],
                                            ['Avg Latency', '2,100ms', '1,200ms', '-900ms', 'up'],
                                        ].map(([metric, ollama, openai, delta, _dir]) => (
                                            <tr key={metric} className="table-row-hover">
                                                <td className="px-4 py-3.5 text-[13px] font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)]">{metric}</td>
                                                <td className="px-4 py-3.5 text-[13px] text-[var(--text-primary)] border-b border-[var(--border-primary)]">{ollama}</td>
                                                <td className="px-4 py-3.5 text-[13px] text-[var(--text-primary)] border-b border-[var(--border-primary)]">{openai}</td>
                                                <td className="px-4 py-3.5 border-b border-[var(--border-primary)]">
                                                    <ScoreChip v={parseFloat(delta) || (delta === '0.00' ? 0 : 0)} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Per-question table */}
                    {tab !== 'Comparison' && report?.questions && (
                        <Card>
                            <CardHeader
                                title="Per-Question Results"
                                action={<Badge variant="blue">Latest Run · {m.total_questions} questions</Badge>}
                            />
                            <CardBody noPadding>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr>
                                                {['ID', 'Question', 'Category', 'Hit@5', 'Faithfulness', 'Relevance'].map((h) => (
                                                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] first:rounded-tl-lg last:rounded-tr-lg">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {report.questions.map((q) => (
                                                <tr key={q.id} className="table-row-hover">
                                                    <td className="px-4 py-3.5 text-[12px] text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">
                                                        #{q.id}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-[13px] font-semibold text-[var(--text-primary)] border-b border-[var(--border-primary)] max-w-[280px]">
                                                        <span className="line-clamp-2">{q.question}</span>
                                                    </td>
                                                    <td className="px-4 py-3.5 border-b border-[var(--border-primary)]">
                                                        <Badge variant={CATEGORY_BADGE[q.category] ?? 'gray'}>
                                                            {q.category}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3.5 border-b border-[var(--border-primary)]">
                                                        <ScoreChip v={q.hit_at_k} />
                                                    </td>
                                                    <td className="px-4 py-3.5 border-b border-[var(--border-primary)]">
                                                        <ScoreChip v={q.faithfulness} />
                                                    </td>
                                                    <td className="px-4 py-3.5 border-b border-[var(--border-primary)]">
                                                        <ScoreChip v={q.answer_relevancy} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardBody>
                        </Card>
                    )}
                </>
            )}
        </div>
    )
}
