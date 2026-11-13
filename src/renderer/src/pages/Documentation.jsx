import React from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Database,
  Download,
  ExternalLink,
  FolderPlus,
  Globe2,
  HardDrive,
  Network,
  Server,
  Settings2,
  Terminal,
  Wrench,
} from 'lucide-react';

const sections = [
  { id: 'quick-start', label: 'Quick start' },
  { id: 'projects', label: 'Projects' },
  { id: 'binaries', label: 'Runtimes and binaries' },
  { id: 'web-servers', label: 'Web servers and domains' },
  { id: 'databases', label: 'Databases' },
  { id: 'services', label: 'Supporting services' },
  { id: 'ports', label: 'Ports and settings' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
];

const servicePorts = [
  ['Nginx', '80', 'Web server'],
  ['Apache', '8081', 'Web server'],
  ['MySQL', '3306', 'Database'],
  ['MariaDB', '3310', 'Database'],
  ['PostgreSQL', '5432', 'Database'],
  ['MongoDB', '27017', 'Database'],
  ['Redis', '6379', 'Cache / queue'],
  ['Memcached', '11211', 'Cache'],
  ['Mailpit web', '8025', 'Email inbox'],
  ['Mailpit SMTP', '1025', 'Email delivery'],
  ['phpMyAdmin', '8080', 'Database UI'],
  ['MinIO API / console', '9000 / 9001', 'Object storage'],
];

function CodeBlock({ children }) {
  return (
    <pre className="my-3 overflow-x-auto rounded-lg bg-gray-950 px-4 py-3 text-xs leading-6 text-gray-100 shadow-inner">
      <code>{children}</code>
    </pre>
  );
}

function Note({ children, tone = 'blue' }) {
  const styles = {
    blue: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800/60 dark:bg-blue-950/30 dark:text-blue-100',
    green: 'border-green-200 bg-green-50 text-green-900 dark:border-green-800/60 dark:bg-green-950/30 dark:text-green-100',
    amber: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-100',
  };

  return <div className={`my-4 rounded-lg border px-4 py-3 text-sm leading-6 ${styles[tone]}`}>{children}</div>;
}

function GuideSection({ id, icon: Icon, title, children }) {
  return (
    <section id={id} className="scroll-mt-6 border-b border-gray-200 pb-10 dark:border-gray-700/80">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg bg-primary-50 p-2 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Step({ number, title, children }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
        {number}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-gray-900 dark:text-white">{title}</h3>
        <div className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">{children}</div>
      </div>
    </div>
  );
}

function ServiceCard({ title, description, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/60">
      <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{description}</p>
      <div className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{children}</div>
    </div>
  );
}

function Documentation() {
  return (
    <div className="min-h-full bg-gray-50 p-6 dark:bg-gray-900 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-2xl bg-gradient-to-br from-primary-700 to-primary-900 px-6 py-8 text-white shadow-lg md:px-8">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-white/15 p-3">
              <BookOpen className="h-7 w-7" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary-100">MyLocalDev guide</p>
              <h1 className="mt-1 text-2xl font-bold md:text-3xl">Develop locally with confidence</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-primary-100 md:text-base">
                Install runtimes, create projects, start databases and supporting services, and connect your applications to everything MyLocalDev manages.
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="self-start lg:sticky lg:top-6">
            <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800/70">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">On this page</p>
              <nav aria-label="Documentation sections" className="space-y-1">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:text-gray-300 dark:hover:bg-primary-900/30 dark:hover:text-primary-300"
                  >
                    {section.label}
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <main className="space-y-10">
            <GuideSection id="quick-start" icon={CheckCircle2} title="Quick start">
              <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                MyLocalDev manages local processes on your computer. Install the tools you need in <strong className="text-gray-900 dark:text-white">Binaries</strong>, create or import a project, then start the project and its required services.
              </p>
              <div className="mt-5 space-y-4">
                <Step number="1" title="Install the runtimes you need">
                  Open <strong>Binaries</strong> and download a PHP version, Node.js, Composer, Git, or any database/service required by your project.
                </Step>
                <Step number="2" title="Create or import a project">
                  Use <strong>New Project</strong> for Laravel, Symfony, CodeIgniter 4, WordPress, Node.js, or a custom PHP project. Use <strong>Import</strong> when the project already exists on disk.
                </Step>
                <Step number="3" title="Choose the project runtime">
                  Select the PHP or Node.js version, web server, database, and supporting services. MyLocalDev stores these choices with the project.
                </Step>
                <Step number="4" title="Start the project">
                  Start the project from <strong>Projects</strong>. MyLocalDev starts the selected web server and required services, then gives the project a local <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">.test</code> address.
                </Step>
                <Step number="5" title="Open the project and inspect logs">
                  Open the project from its card. If something does not start, open <strong>Logs</strong> and select the project or service that reported the error.
                </Step>
              </div>
              <Note tone="green">
                MyLocalDev keeps project configuration separate from installed binaries. You can run different PHP, Node.js, or database versions for different projects on the same machine.
              </Note>
            </GuideSection>

            <GuideSection id="projects" icon={FolderPlus} title="Create and manage projects">
              <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                The project wizard creates the folder, installs the framework when requested, configures the environment, and connects the project to MyLocalDev's service manager.
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <ServiceCard title="Framework projects" description="Fresh projects installed with Composer or the framework's official tooling.">
                  <ul className="list-disc space-y-1 pl-5">
                    <li><strong>Laravel:</strong> Composer installation, application key, and optional frontend setup.</li>
                    <li><strong>Symfony:</strong> Composer installation and Symfony console-ready configuration.</li>
                    <li><strong>CodeIgniter 4:</strong> Composer appstarter installation, database settings, and <code>public</code> document root.</li>
                    <li><strong>WordPress:</strong> Download and configure the WordPress files and database connection.</li>
                  </ul>
                </ServiceCard>
                <ServiceCard title="Existing and custom projects" description="Bring an existing folder into MyLocalDev without replacing its source files.">
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Use <strong>Import Project</strong> and select the project folder.</li>
                    <li>MyLocalDev reads the existing <code>.env</code> and detects the project type where possible.</li>
                    <li>For custom PHP, choose the correct document root: usually <code>public</code> for modern frameworks or the project folder for simple PHP.</li>
                    <li>For Node.js, provide the command that starts the development server.</li>
                  </ul>
                </ServiceCard>
              </div>
              <Note>
                A project normally uses the <code>public</code> folder as its document root when that folder exists. This prevents private source files and environment files from being served by the web server.
              </Note>
            </GuideSection>

            <GuideSection id="binaries" icon={Download} title="Runtimes and binaries">
              <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                Binaries are the runtimes and command-line tools that MyLocalDev downloads and manages. Download a binary before selecting it in a project or service.
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <ServiceCard title="PHP" description="Run multiple PHP versions side by side and select one per project.">
                  PHP is used by the web server, Composer, project terminals, workers, and framework commands. Set a default in <strong>Settings</strong>, or select a different version in each project.
                </ServiceCard>
                <ServiceCard title="Node.js" description="Build frontend assets and run Node.js projects.">
                  Install the required version, then use <code>npm install</code>, <code>npm run dev</code>, or the project's configured start command. Node projects are proxied through the local project domain.
                </ServiceCard>
                <ServiceCard title="Python" description="Use Python for scripts and project tooling.">
                  Choose a default Python version in Settings. Python is a runtime, not a background server in MyLocalDev; start a Python web server from the project terminal when needed.
                </ServiceCard>
                <ServiceCard title="Composer and Git" description="Project dependency and source-control tooling.">
                  Composer automatically uses the selected project PHP version. Git is used for cloning and source control; credentials remain managed by your normal Git or SSH setup.
                </ServiceCard>
              </div>
              <Note tone="amber">
                If a runtime is missing, the project can be created but it may not start. Open Binaries, install the requested version, and start the project again.
              </Note>
            </GuideSection>

            <GuideSection id="web-servers" icon={Globe2} title="Web servers and local domains">
              <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                Nginx and Apache receive browser requests and route them to your project. Choose one web server per project in the project settings.
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <ServiceCard title="Nginx" description="Fast web server and reverse proxy.">
                  Use Nginx for PHP-FPM projects and Node.js applications. MyLocalDev generates the virtual host and routes the configured project domain to the correct runtime or Node port.
                </ServiceCard>
                <ServiceCard title="Apache" description="Web server with broad .htaccess compatibility.">
                  Use Apache when the project depends on <code>.htaccess</code> or Apache-specific modules. MyLocalDev generates the virtual host and enables the project's document root.
                </ServiceCard>
              </div>
              <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/60">
                <h3 className="font-semibold text-gray-900 dark:text-white">Opening a project</h3>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-gray-600 dark:text-gray-300">
                  <li>Start the project from the Projects page.</li>
                  <li>Click the project URL or Open button.</li>
                  <li>If HTTPS is enabled, trust the local certificate when Windows asks.</li>
                  <li>Use the generated <code>.test</code> domain instead of a raw localhost port so cookies, redirects, and virtual hosts behave like a real site.</li>
                </ol>
              </div>
            </GuideSection>

            <GuideSection id="databases" icon={Database} title="Databases">
              <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                Use the <strong>Databases</strong> page to start a database version and create, import, export, or remove databases. Projects can request their database service automatically.
              </p>
              <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-100 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      <tr><th className="px-4 py-3">Database</th><th className="px-4 py-3">Typical connection</th><th className="px-4 py-3">Use it for</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900/30">
                      <tr><td className="px-4 py-3 font-medium text-gray-900 dark:text-white">MySQL / MariaDB</td><td className="px-4 py-3 text-gray-600 dark:text-gray-300"><code>127.0.0.1:3306</code> / <code>127.0.0.1:3310</code></td><td className="px-4 py-3 text-gray-600 dark:text-gray-300">Laravel, WordPress, CodeIgniter, PHP apps</td></tr>
                      <tr><td className="px-4 py-3 font-medium text-gray-900 dark:text-white">PostgreSQL</td><td className="px-4 py-3 text-gray-600 dark:text-gray-300"><code>127.0.0.1:5432</code></td><td className="px-4 py-3 text-gray-600 dark:text-gray-300">PostgreSQL applications and APIs</td></tr>
                      <tr><td className="px-4 py-3 font-medium text-gray-900 dark:text-white">MongoDB</td><td className="px-4 py-3 text-gray-600 dark:text-gray-300"><code>mongodb://127.0.0.1:27017</code></td><td className="px-4 py-3 text-gray-600 dark:text-gray-300">Document-oriented applications</td></tr>
                      <tr><td className="px-4 py-3 font-medium text-gray-900 dark:text-white">SQLite</td><td className="px-4 py-3 text-gray-600 dark:text-gray-300">A local <code>.sqlite</code> file</td><td className="px-4 py-3 text-gray-600 dark:text-gray-300">Small or embedded applications</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <Note>
                Versioned databases use port offsets so multiple versions can run at once. The exact port for a selected version is shown in the Databases and Services pages; use that value in your application's environment file.
              </Note>
            </GuideSection>

            <GuideSection id="services" icon={Server} title="Supporting services">
              <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                These services are optional helpers for caching, email testing, administration, and object storage. Start only what your project needs.
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <ServiceCard title="Redis" description="Cache, queue, session, and pub/sub server.">
                  Connect with host <code>127.0.0.1</code> and the Redis port from Settings. Laravel commonly uses Redis for cache, queues, and sessions. Redis does not provide a web inbox; inspect its status from Services and its logs from Logs.
                </ServiceCard>
                <ServiceCard title="Memcached" description="Simple distributed in-memory cache.">
                  Connect with host <code>127.0.0.1</code> and port <code>11211</code> by default. Use Memcached when your framework or application specifically supports it; it is not a database and does not persist data like MySQL.
                </ServiceCard>
                <ServiceCard title="Mailpit" description="Capture application email without sending it to real people.">
                  Set your app's SMTP host to <code>127.0.0.1</code>, SMTP port to <code>1025</code>, encryption to <strong>None</strong>, and leave username/password blank. Open the Mailpit web inbox at <code>http://127.0.0.1:8025</code> and inspect the captured messages.
                  <CodeBlock>{`MAIL_HOST=127.0.0.1\nMAIL_PORT=1025\nMAIL_ENCRYPTION=null\nMAIL_USERNAME=\nMAIL_PASSWORD=`}</CodeBlock>
                </ServiceCard>
                <ServiceCard title="phpMyAdmin" description="Browser-based administration for MySQL and MariaDB.">
                  Start MySQL or MariaDB first, then start phpMyAdmin and click <strong>Open</strong>. Log in with the database credentials configured in Settings. phpMyAdmin's web port is separate from the database port and can be changed in Settings.
                </ServiceCard>
                <ServiceCard title="MinIO" description="S3-compatible object storage for local development.">
                  Use the MinIO console for buckets and objects, normally at <code>http://127.0.0.1:9001</code>. Applications connect to the S3 API, normally <code>http://127.0.0.1:9000</code>. Use the credentials shown or configured by your local project setup, and update both ports if you change them in Settings.
                </ServiceCard>
                <ServiceCard title="Cloudflared and zrok" description="Optional public or shareable tunnels.">
                  Install the required binary first, configure the provider from the relevant project or Settings controls, and enable sharing only when you need a public URL. Treat tunnel URLs as public and never expose development secrets through them.
                </ServiceCard>
              </div>
            </GuideSection>

            <GuideSection id="ports" icon={Settings2} title="Ports and Settings">
              <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                Settings is the source of truth for the base ports used by MyLocalDev. Change a port when another application already occupies it or when your project expects a different local endpoint.
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/60">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Default ports</h3>
                  <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full text-left text-xs">
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {servicePorts.map(([service, port, type]) => (
                          <tr key={service}>
                            <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{service}</td>
                            <td className="px-3 py-2 font-mono text-gray-600 dark:text-gray-300">{port}</td>
                            <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/60">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Changing a port safely</h3>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-gray-600 dark:text-gray-300">
                    <li>Open <strong>Settings</strong> and edit the service's port field.</li>
                    <li>Save the settings.</li>
                    <li>Stop and start the affected service again. Restart MyLocalDev if the service was already running.</li>
                    <li>Update your project's environment variables to match the new port.</li>
                    <li>Use the service card's actual port if MyLocalDev had to move a service because the requested port was busy.</li>
                  </ol>
                </div>
              </div>
              <Note tone="amber">
                A web port and a service protocol port are not interchangeable. For Mailpit, the browser uses the web port while your application uses the SMTP port. For MinIO, applications use the API port while people use the console port.
              </Note>
            </GuideSection>

            <GuideSection id="troubleshooting" icon={Wrench} title="Troubleshooting">
              <div className="grid gap-4 md:grid-cols-2">
                <ServiceCard title="The service will not start" description="Usually a missing binary, occupied port, or invalid configuration.">
                  Check that the binary is installed in Binaries, verify the port in Settings, stop the conflicting application, and inspect the service log in Logs. Start the service again after correcting the issue.
                </ServiceCard>
                <ServiceCard title="The project opens a 502 or connection error" description="The web server cannot reach the project's runtime.">
                  Confirm that the selected PHP or Node.js version is installed and that the project is running. For Node.js, verify the configured start command and application port. For PHP, verify the document root and PHP version.
                </ServiceCard>
                <ServiceCard title="Email does not appear in Mailpit" description="The application is probably using the wrong SMTP endpoint.">
                  Confirm Mailpit is running, use <code>127.0.0.1</code> rather than a public SMTP hostname, use the configured SMTP port rather than the web port, disable encryption, and clear your framework's cached configuration.
                </ServiceCard>
                <ServiceCard title="The database connection fails" description="The application may be using the wrong version port or credentials.">
                  Start the selected database version, copy the actual port shown by MyLocalDev, verify the database name and credentials, and check the database service log. Remember that MySQL and MariaDB are separate services.
                </ServiceCard>
              </div>
              <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800/60">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">When asking for help</h3>
                    <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-300">
                      Include the project type, selected runtime versions, configured ports, the service status, and the relevant lines from Logs. Never include passwords, API keys, or private tunnel URLs.
                    </p>
                  </div>
                </div>
              </div>
            </GuideSection>

            <footer className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-2"><Terminal className="h-4 w-4" /> Use the project terminal for framework commands.</span>
              <span className="flex items-center gap-2"><Network className="h-4 w-4" /> Use Settings for service endpoints.</span>
              <span className="flex items-center gap-2"><HardDrive className="h-4 w-4" /> Use Logs when a process fails.</span>
              <a className="ml-auto inline-flex items-center gap-1 text-primary-600 hover:underline dark:text-primary-400" href="https://github.com/playpixelpro/mylocaldev" target="_blank" rel="noreferrer">
                Source repository <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}

export default Documentation;
