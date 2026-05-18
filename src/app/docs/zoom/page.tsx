import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zoom Integration — Akademo',
  description: 'How to add, use, and remove the Zoom integration in Akademo',
};

export default function ZoomDocsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 py-4 px-6">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <a href="/" className="text-xl font-bold text-gray-900 tracking-tight">AKADEMO</a>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 text-sm">Zoom Integration</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6 16.8L8.4 12 18 7.2V16.8z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Zoom Integration</h1>
            <p className="text-gray-500 text-sm mt-0.5">Connect your Zoom account to run live classes and auto-save recordings.</p>
          </div>
        </div>

        <div className="space-y-10">
          {/* Section 1 — Adding */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">1</span>
              Adding the Integration
            </h2>
            <div className="bg-gray-50 rounded-xl p-5 space-y-3 text-sm text-gray-700">
              <p>The Zoom integration is available for <strong>Academy accounts</strong> only.</p>
              <ol className="list-decimal list-inside space-y-2 pl-1">
                <li>Log in to your Akademo academy account at <a href="https://akademo-edu.com" className="text-blue-600 hover:underline">akademo-edu.com</a>.</li>
                <li>Go to <strong>Dashboard → Profile</strong> (click your account in the left sidebar).</li>
                <li>Scroll to the <strong>&quot;Integraciones&quot;</strong> section.</li>
                <li>Click <strong>&quot;Conectar Zoom&quot;</strong>.</li>
                <li>You will be redirected to Zoom&#39;s authorization page. Log in with your Zoom account and click <strong>Allow</strong>.</li>
                <li>You are redirected back to Akademo. Your Zoom account is now connected and shown in the Integraciones panel.</li>
              </ol>
              <p className="text-gray-500">Alternatively, visit <a href="https://akademo-edu.com/connect/zoom" className="text-blue-600 hover:underline">akademo-edu.com/connect/zoom</a> to start the authorization flow directly.</p>
            </div>

            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-800">
              <strong>Requirements:</strong> You need a <strong>Zoom Pro</strong> (or higher) account. Free Zoom accounts do not support the required API permissions.
            </div>
          </section>

          {/* Section 2 — Using */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">2</span>
              Using the Integration
            </h2>
            <div className="space-y-4 text-sm text-gray-700">
              <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                <h3 className="font-semibold text-gray-900">Assigning Zoom to a Class</h3>
                <ol className="list-decimal list-inside space-y-2 pl-1">
                  <li>Open a class from your Dashboard.</li>
                  <li>In the class settings, select your connected Zoom account from the <strong>&quot;Cuenta de Zoom&quot;</strong> dropdown.</li>
                  <li>Save changes.</li>
                </ol>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                <h3 className="font-semibold text-gray-900">Starting a Live Stream</h3>
                <ol className="list-decimal list-inside space-y-2 pl-1">
                  <li>Navigate to your class and click <strong>&quot;Stream&quot;</strong>.</li>
                  <li>Akademo creates a Zoom meeting in your connected account automatically.</li>
                  <li>Students can join the meeting directly from their dashboard — no Zoom account required.</li>
                </ol>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                <h3 className="font-semibold text-gray-900">Automatic Recordings</h3>
                <p>When a live session ends, Akademo automatically retrieves the Zoom cloud recording and saves it to the class content library. Students can watch the recording from their dashboard within a few minutes of the session ending.</p>
              </div>
            </div>
          </section>

          {/* Section 3 — Removing */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-bold">3</span>
              Removing the Integration
            </h2>
            <div className="bg-gray-50 rounded-xl p-5 space-y-3 text-sm text-gray-700">
              <p><strong>From Akademo:</strong></p>
              <ol className="list-decimal list-inside space-y-2 pl-1">
                <li>Go to <strong>Dashboard → Profile → Integraciones</strong>.</li>
                <li>Click the <strong>trash / disconnect icon</strong> next to the Zoom account you want to remove.</li>
                <li>Confirm the action. The connection is immediately removed from Akademo.</li>
              </ol>
              <p className="mt-3"><strong>From Zoom Marketplace (full revocation):</strong></p>
              <ol className="list-decimal list-inside space-y-2 pl-1">
                <li>Go to <a href="https://marketplace.zoom.us/user/installed" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">marketplace.zoom.us/user/installed</a>.</li>
                <li>Find <strong>Akademo</strong> and click <strong>Remove</strong>.</li>
                <li>This revokes all OAuth tokens and removes Akademo&#39;s access to your Zoom account permanently.</li>
              </ol>
              <p className="text-gray-500 mt-3">After removing, any classes that used the disconnected Zoom account will fall back to the platform&#39;s default Zoom settings.</p>
            </div>
          </section>

          {/* Section 4 — Permissions */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Permissions Requested</h2>
            <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-700">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-2 font-semibold text-gray-900">Permission</th>
                    <th className="pb-2 font-semibold text-gray-900">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="py-2"><td className="py-2 pr-4 font-mono text-xs text-gray-600">meeting:write</td><td className="py-2">Create and manage Zoom meetings for live classes.</td></tr>
                  <tr><td className="py-2 pr-4 font-mono text-xs text-gray-600">recording:read</td><td className="py-2">Access cloud recordings to save them to the class library.</td></tr>
                  <tr><td className="py-2 pr-4 font-mono text-xs text-gray-600">user:read</td><td className="py-2">Display the connected account name in the Akademo dashboard.</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Support */}
          <section className="border-t border-gray-100 pt-8">
            <p className="text-sm text-gray-500">
              Need help? Contact us at <a href="mailto:hola@akademo-edu.com" className="text-blue-600 hover:underline">hola@akademo-edu.com</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
