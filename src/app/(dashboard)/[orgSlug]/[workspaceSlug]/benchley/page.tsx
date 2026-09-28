import { Zap, Gauge, TrendingUp, Activity, Clock, ShieldCheck, ExternalLink, CheckCircle2, Download, Share2 } from "lucide-react";

export default function BenchleyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Open Benchley Banner */}
      <div className="border-b border-yellow-400/20 bg-gradient-to-r from-yellow-400/5 to-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-yellow-400/10 border border-yellow-400/30">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-yellow-400">Benchley</h1>
                <p className="text-xs text-zinc-400">High-performance API load testing platform</p>
              </div>
            </div>
            <a
              href="https://benchley.ssh.net.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-400 text-black font-bold text-sm hover:bg-yellow-300 transition-all shadow-glow-sm"
            >
              <span>Open Benchley</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold">What is Benchley?</h2>
          <p className="max-w-3xl mx-auto text-lg text-zinc-400 leading-relaxed">
            Benchley is a high-performance API load testing platform powered by k6. It helps you understand how your application performs under various real-world conditions through automated performance testing.
          </p>
        </div>

        {/* What is k6 */}
        <div className="space-y-8 mb-16">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">What is k6?</h3>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              k6 is a modern, developer-centric load testing tool built for the cloud era.
            </p>
          </div>

          <div className="p-8 rounded-2xl border border-yellow-400/20 bg-yellow-400/5 space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-yellow-400/20 border border-yellow-400/40 shrink-0">
                <Zap className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="space-y-3 flex-1">
                <h4 className="text-xl font-bold text-yellow-400">JavaScript-Based Testing</h4>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  k6 tests are written in JavaScript, making them accessible to developers who already know the language. You don't need to learn a proprietary scripting language. The tests are simple and require only a few lines of code to get started.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-yellow-400/20 border border-yellow-400/40 shrink-0">
                <Gauge className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="space-y-3 flex-1">
                <h4 className="text-xl font-bold text-yellow-400">Virtual Users</h4>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  k6 uses the concept of virtual users (VUs) to simulate load. Each virtual user represents a concurrent user making requests to your application. You can configure the number of virtual users and how they ramp up over time to create realistic load scenarios.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-yellow-400/20 border border-yellow-400/40 shrink-0">
                <TrendingUp className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="space-y-3 flex-1">
                <h4 className="text-xl font-bold text-yellow-400">Performance Thresholds</h4>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  With k6, you can define performance thresholds as part of your test setup. For example, you can specify that 99% of requests should complete within 100 milliseconds. k6 will automatically validate these thresholds during the test run and report whether they were met.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-yellow-400/20 border border-yellow-400/40 shrink-0">
                <Download className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="space-y-3 flex-1">
                <h4 className="text-xl font-bold text-yellow-400">Report Download</h4>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Export detailed test reports in various formats (JSON, CSV, PDF) for documentation, analysis, and sharing with stakeholders. Keep records of performance metrics over time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Why Performance Testing */}
        <div className="space-y-12 mb-16">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">Why Performance Testing?</h3>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              You might already write unit and integration tests to ensure your application works as designed. These are functional tests. But you also need to consider non-functional tests.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-yellow-400/10 border border-yellow-400/30">
                  <ShieldCheck className="w-6 h-6 text-yellow-400" />
                </div>
                <h4 className="text-lg font-bold">Functional Tests</h4>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Unit and integration tests verify that your application functions correctly. They ensure features work as designed by testing the functionality of your application - does it do what it's supposed to do?
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-yellow-400/30 bg-yellow-400/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-yellow-400/20 border border-yellow-400/40">
                  <Gauge className="w-6 h-6 text-yellow-400" />
                </div>
                <h4 className="text-lg font-bold text-yellow-400">Non-Functional Tests</h4>
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed">
                Non-functional tests evaluate how your application performs under various conditions. This includes testing for security, efficiency, reliability, and performance. Performance testing specifically gives you an idea of how your application is likely to perform under various real-world conditions.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
            <h4 className="text-lg font-bold text-white mb-4">Why Performance Testing Matters</h4>
            <ul className="space-y-3 text-zinc-400 text-sm leading-relaxed">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Real-world simulation:</strong> Your application won't run on your development machine in production. Performance testing against a production-like environment reveals how it will actually perform.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Capacity planning:</strong> Understand your system's limits and plan infrastructure accordingly before you need to scale.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Prevent downtime:</strong> Catch performance bottlenecks and breaking points before they affect real users.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">SLA compliance:</strong> Ensure your application meets service level agreements and performance requirements.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Types of Performance Testing */}
        <div className="space-y-8 mb-16">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">Types of Performance Testing</h3>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Benchley supports multiple types of performance tests to help you understand different aspects of your application's behavior.
            </p>
          </div>

          <div className="space-y-6">
            {/* Load Testing */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 shrink-0">
                  <Gauge className="w-6 h-6 text-blue-400" />
                </div>
                <div className="space-y-3 flex-1">
                  <h4 className="text-xl font-bold text-blue-400">Load Testing</h4>
                  <p className="text-zinc-300 text-sm leading-relaxed">
                    Determines how your application responds under average load. If your typical day sees 200 requests per second, that's what you set your load test to. The purpose is to ensure your application meets specific performance requirements under normal operating conditions.
                  </p>
                  <div className="space-y-2 pt-2">
                    <p className="text-zinc-400 text-xs"><strong className="text-white">How it works:</strong> You configure multiple virtual users with one call per user per second, then slowly ramp up to your target load (e.g., 200 requests per second), maintain it for a sustained period (e.g., 20 minutes), then ramp back down.</p>
                    <p className="text-zinc-400 text-xs"><strong className="text-white">What it checks:</strong> Response times, throughput, error rates, and whether your application meets performance thresholds like "99% of requests should complete within 100 milliseconds."</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono">Average Load</span>
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono">Performance Requirements</span>
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono">Threshold Validation</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stress Testing */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 shrink-0">
                  <TrendingUp className="w-6 h-6 text-orange-400" />
                </div>
                <div className="space-y-3 flex-1">
                  <h4 className="text-xl font-bold text-orange-400">Stress Testing</h4>
                  <p className="text-zinc-300 text-sm leading-relaxed">
                    Shows how your application handles increased load beyond normal conditions. You can increase requests by 50-100% or push until your application breaks to know your system's limits and breaking point.
                  </p>
                  <div className="space-y-2 pt-2">
                    <p className="text-zinc-400 text-xs"><strong className="text-white">How it works:</strong> Slowly ramp up the number of requests over time (e.g., from 200 to 1,000 requests per second over 23 minutes), keeping each level stable for a period to observe system behavior.</p>
                    <p className="text-zinc-400 text-xs"><strong className="text-white">What it checks:</strong> How CPU, memory, and other resources respond to increasing load. At higher loads, you'll see response times increase and resource usage rise, helping you understand when your system starts to struggle.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-mono">Increased Load</span>
                    <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-mono">Breaking Point</span>
                    <span className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-mono">System Limits</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Spike Testing */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 shrink-0">
                  <Activity className="w-6 h-6 text-red-400" />
                </div>
                <div className="space-y-3 flex-1">
                  <h4 className="text-xl font-bold text-red-400">Spike Testing</h4>
                  <p className="text-zinc-300 text-sm leading-relaxed">
                    Simulates sudden traffic spikes that quickly die off. This tests how your application handles viral scenarios like getting on the front page of Hacker News or a social media post going viral.
                  </p>
                  <div className="space-y-2 pt-2">
                    <p className="text-zinc-400 text-xs"><strong className="text-white">How it works:</strong> Very quick ramp up of traffic to a high level (e.g., 2,000 requests per second), hold it for a short duration (e.g., 2 minutes), then quickly drop back down to normal levels.</p>
                    <p className="text-zinc-400 text-xs"><strong className="text-white">What it checks:</strong> Whether your application can survive sudden massive traffic without crashing. You'll see very high CPU and memory usage during the spike, and response times may degrade significantly.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">Sudden Traffic</span>
                    <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">Quick Ramp Up</span>
                    <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono">Viral Scenarios</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Soak Testing */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 shrink-0">
                  <Clock className="w-6 h-6 text-purple-400" />
                </div>
                <div className="space-y-3 flex-1">
                  <h4 className="text-xl font-bold text-purple-400">Soak Testing</h4>
                  <p className="text-zinc-300 text-sm leading-relaxed">
                    Runs tests for extended periods (typically 8+ hours) to catch issues that happen gradually over time. Running a load test for 30 minutes isn't enough to gauge long-term stability.
                  </p>
                  <div className="space-y-2 pt-2">
                    <p className="text-zinc-400 text-xs"><strong className="text-white">How it works:</strong> Similar to load testing but runs for much longer durations. Set virtual users to match average load and run for extended periods (8 hours or more) with a short ramp up, sustained load, and short ramp down.</p>
                    <p className="text-zinc-400 text-xs"><strong className="text-white">What it checks:</strong> Memory leaks, excessive disk space usage, database connection pool exhaustion, rate limits on third-party APIs, and whether your application loses requests during restarts. These issues accumulate gradually and won't appear in short tests.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono">Extended Duration</span>
                    <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono">Memory Leaks</span>
                    <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono">Stability Check</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">Why Use Benchley?</h3>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Built for developers who want to ensure their applications can handle real-world traffic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'k6 Powered',
                desc: 'Leverage the power of k6, a modern load testing tool with JavaScript-based test scripts.',
              },
              {
                icon: Gauge,
                title: 'Real-time Telemetry',
                desc: 'Monitor your tests in real-time with live metrics and performance data.',
              },
              {
                icon: TrendingUp,
                title: 'Performance Thresholds',
                desc: 'Set SLO criteria and ensure your application meets performance requirements.',
              },
              {
                icon: Download,
                title: 'Report Download',
                desc: 'Export detailed test reports in JSON, CSV, or PDF formats for documentation and analysis.',
              },
              {
                icon: Share2,
                title: 'Sharable Reports',
                desc: 'Generate shareable links to test results for easy collaboration with team members and stakeholders.',
              },
              {
                icon: Activity,
                title: 'Multiple Test Types',
                desc: 'Support for load, stress, spike, and soak testing scenarios.',
              },
              {
                icon: CheckCircle2,
                title: 'Easy to Use',
                desc: 'Simple interface for configuring and running complex load tests.',
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4 hover:border-yellow-400/30 transition-colors">
                  <div className="p-3 rounded-xl bg-yellow-400/10 border border-yellow-400/30 w-fit">
                    <Icon className="w-6 h-6 text-yellow-400" />
                  </div>
                  <h4 className="text-lg font-bold">{feature.title}</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
