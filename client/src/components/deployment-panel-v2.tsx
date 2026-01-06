import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Upload, 
  Settings, 
  Zap, 
  ExternalLink, 
  Code,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import SimpleChatbot from './SimpleChatbot';
import { useBuilderStore } from '../store/builderStore';
import { getApiUrl } from '../lib/config';

// Environment mode: 'local' or 'production'
const ENVIRONMENT_MODE: 'local' | 'production' = 'production';

interface DeploymentPanelV2Props {
  isChatbotOpen?: boolean;
  onChatbotClose?: () => void;
  projectId?: string;
}

export default function DeploymentPanelV2({ 
  isChatbotOpen = false,
  onChatbotClose,
  projectId 
}: DeploymentPanelV2Props) {
  const { code, addDeploymentHistory, setCode, currentFile, updateFile } = useBuilderStore();
  const [loading, setLoading] = useState(false);
  const [networkType, setNetworkType] = useState('testnet');
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const [initStatus, setInitStatus] = useState<'pending' | 'processing' | 'complete' | 'error'>('pending');
  const [compileStatus, setCompileStatus] = useState<'pending' | 'processing' | 'complete' | 'error'>('pending');
  const [deployStatus, setDeployStatus] = useState<'pending' | 'processing' | 'complete' | 'error'>('pending');
  const [compileButtonDisabled, setCompileButtonDisabled] = useState(true);
  const [deployButtonDisabled, setDeployButtonDisabled] = useState(true);
  const [currentData, setCurrentData] = useState<any>(null);
  const [latestResponse, setLatestResponse] = useState<string>('');
  const [rawResponse, setRawResponse] = useState<string>('');
  const [showProductionOverlay, setShowProductionOverlay] = useState(false);
  const [overlayAction, setOverlayAction] = useState('');

  // Load project data from MongoDB on mount
  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const loadProjectData = async () => {
    if (!projectId) return;
    
    try {
      const response = await fetch(getApiUrl(`projects/${projectId}`));
      const data = await response.json();
      
      if (data.success && data.project) {
        // Reset all states first
        setInitStatus('pending');
        setCompileStatus('pending');
        setDeployStatus('pending');
        setCompileButtonDisabled(true);
        setDeployButtonDisabled(true);
        
        // Get latest status for each type from deploymentHistory
        const history = data.project.deploymentHistory || [];
        
        // Find latest entry for each type
        const getLatestStatus = (type: string) => {
          const entries = history.filter((h: any) => h.type === type);
          if (entries.length === 0) return null;
          // Sort by timestamp descending and get the first one
          const latest = entries.sort((a: any, b: any) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0];
          return latest.status;
        };
        
        const latestInitStatus = getLatestStatus('init');
        const latestCompileStatus = getLatestStatus('compile');
        const latestDeployStatus = getLatestStatus('deploy');
        
        // Set init status
        if (latestInitStatus === 'success') {
          setInitStatus('complete');
          setCompileButtonDisabled(false);
        } else if (latestInitStatus === 'error') {
          setInitStatus('error');
        }
        
        // Set compile status
        if (latestCompileStatus === 'success') {
          setCompileStatus('complete');
          setDeployButtonDisabled(false);
        } else if (latestCompileStatus === 'error') {
          setCompileStatus('error');
        }
        
        // Set deploy status
        if (latestDeployStatus === 'success') {
          setDeployStatus('complete');
        } else if (latestDeployStatus === 'error') {
          setDeployStatus('error');
        }
        
        // Load current data from latest actions
        if (data.project.initData) {
          setCurrentData((prev: any) => ({ ...prev, ...data.project.initData }));
        }
        if (data.project.deployData?.success) {
          setCurrentData((prev: any) => ({ ...prev, ...data.project.deployData }));
        }
      }
    } catch (error) {
      console.error('Error loading project data:', error);
    }
  };

  const updateStatus = (type: 'init' | 'compile' | 'deploy', status: 'pending' | 'processing' | 'complete' | 'error') => {
    if (type === 'init') setInitStatus(status);
    if (type === 'compile') setCompileStatus(status);
    if (type === 'deploy') setDeployStatus(status);
  };

  const saveHistory = (type: 'init' | 'compile' | 'deploy', data: any, success: boolean) => {
    addDeploymentHistory({
      id: `${type}-${Date.now()}`,
      type,
      status: success ? 'success' : 'error',
      timestamp: new Date(),
      data: {
        ...data,
        error: success ? undefined : data.error,
      },
    });
  };

  const initializeProject = async () => {
    if (ENVIRONMENT_MODE === 'production') {
      setOverlayAction('Initialize');
      setShowProductionOverlay(true);
      return;
    }
    if (!code.trim()) return;

    setLoading(true);
    updateStatus('init', 'processing');

    try {
      const res = await fetch(getApiUrl('init'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          moveCode: code, 
          networkType, 
          privateKey: privateKeyInput.trim(),
          projectId 
        }),
      });

      const data = await res.json();
      const success = data.success;

      saveHistory('init', {
        address: data.address,
        moduleName: data.moduleName,
        packageName: data.packageName,
        faucetUrl: data.address ? `https://faucet.movementnetwork.xyz/?address=${data.address}` : undefined,
        log: data.log,
        error: data.error,
      }, success);

      if (success) {
        updateStatus('init', 'complete');
        setCompileButtonDisabled(false);
        setCurrentData(data);
        setLatestResponse(`✅ Initialization successful! Address: ${data.address}`);
        setRawResponse(JSON.stringify(data, null, 2));
        // Reload project data from DB to sync button states
        await loadProjectData();
      } else {
        updateStatus('init', 'error');
        setLatestResponse(`❌ Initialization failed: ${data.error || 'Unknown error'}`);
        setRawResponse(JSON.stringify(data, null, 2));
        // Reload project data from DB even on error
        await loadProjectData();
      }
    } catch (error: any) {
      saveHistory('init', { error: error.message }, false);
      updateStatus('init', 'error');
    } finally {
      setLoading(false);
      setPrivateKeyInput('');
    }
  };

  const compilePackage = async () => {
    if (ENVIRONMENT_MODE === 'production') {
      setOverlayAction('Compile');
      setShowProductionOverlay(true);
      return;
    }
    if (!code.trim()) return;

    setLoading(true);
    updateStatus('compile', 'processing');

    try {
      const res = await fetch(getApiUrl('compile'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moveCode: code, projectId }),
      });

      const data = await res.json();
      const success = data.success;

      saveHistory('compile', {
        log: data.log,
        error: data.error,
      }, success);

      if (success) {
        updateStatus('compile', 'complete');
        setDeployButtonDisabled(false);
        setLatestResponse('✅ Compilation successful!');
        setRawResponse(JSON.stringify(data, null, 2));
        // Reload project data from DB to sync button states
        await loadProjectData();
      } else {
        updateStatus('compile', 'error');
        setLatestResponse(`❌ Compilation failed: ${data.error || 'Unknown error'}`);
        setRawResponse(JSON.stringify(data, null, 2));
        // Reload project data from DB even on error
        await loadProjectData();
      }
    } catch (error: any) {
      saveHistory('compile', { error: error.message }, false);
      updateStatus('compile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deployPackage = async () => {
    if (ENVIRONMENT_MODE === 'production') {
      setOverlayAction('Deploy');
      setShowProductionOverlay(true);
      return;
    }
    if (!code.trim()) return;

    setLoading(true);
    updateStatus('deploy', 'processing');

    try {
      const res = await fetch(getApiUrl('deploy'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moveCode: code, projectId }),
      });

      const data = await res.json();
      const success = data.success;

      saveHistory('deploy', {
        transactionHash: data.transactionHash,
        address: data.senderAddress,
        moduleName: data.moduleName,
        explorerUrls: data.explorerUrls,
        log: data.log,
        error: data.error,
      }, success);

      if (success) {
        updateStatus('deploy', 'complete');
        updateStatus('init', 'complete');
        updateStatus('compile', 'complete');
        setCurrentData(data);
        setLatestResponse(`✅ Deployment successful! TX: ${data.transactionHash?.substring(0, 10)}...`);
        setRawResponse(JSON.stringify(data, null, 2));
        // Reload project data from DB to sync button states
        await loadProjectData();
      } else {
        updateStatus('deploy', 'error');
        setLatestResponse(`❌ Deployment failed: ${data.error || 'Unknown error'}`);
        setRawResponse(JSON.stringify(data, null, 2));
        // Reload project data from DB even on error
        await loadProjectData();
      }
    } catch (error: any) {
      saveHistory('deploy', { error: error.message }, false);
      updateStatus('deploy', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0e1a] relative overflow-hidden">
      {/* Production Mode Overlay */}
      {showProductionOverlay && (
        <div className="absolute -bottom-7 inset-0 z-50 backdrop-blur-sm flex items-end justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-t-2xl border-2 border-amber-500/50 p-6 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Service Currently Unavailable</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  <span className="font-medium text-amber-400">{overlayAction}</span> action cannot be performed at this time as the virtual machine is currently down for maintenance.
                </p>
              </div>
            </div>
            <div className="bg-slate-950/50 rounded p-3 mb-4">
              <p className="text-xs text-slate-400 mb-2">Watch our demo video to see how this feature works:</p>
              <a 
                href="https://www.youtube.com/watch?v=hqAkiPw-mno&t=83s" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Demo on YouTube
              </a>
            </div>
            <Button 
              onClick={() => setShowProductionOverlay(false)}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              Close
            </Button>
          </div>
        </div>
      )}
      
      <SimpleChatbot 
        isOpen={isChatbotOpen} 
        onClose={onChatbotClose || (() => {})}
        onCodeGenerated={(newCode) => {
          // Update code in store
          setCode(newCode);
          updateFile(currentFile, newCode);
        }}
      />

      <div className="flex-1 overflow-hidden overflow-y-auto">
        <div className="h-full p-4 space-y-3">
          {/* Configuration - Minimal */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Config</span>
            </div>
            <div className="flex flex-col gap-2">
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">Network</Label>
                <Select value={networkType} onValueChange={setNetworkType} disabled={loading}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-200 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    <SelectItem value="testnet">Testnet</SelectItem>
                    <SelectItem value="devnet">Devnet</SelectItem>
                    <SelectItem value="mainnet">Mainnet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-slate-500 mb-1 block">Private Key</Label>
                <Input
                  type="password"
                  placeholder="Auto-generated if left blank"
                  value={privateKeyInput}
                  onChange={(e) => setPrivateKeyInput(e.target.value)}
                  disabled={loading}
                  className="bg-slate-900/50 border-slate-700 text-slate-200 h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/50 my-3"></div>

          {/* Status - Minimal */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1.5 px-2 bg-slate-900/30 rounded border border-slate-800/30">
                <div className="flex items-center gap-2">
                  {getStatusIcon(initStatus)}
                  <span className="text-xs text-slate-300">Initialize</span>
                </div>
                <span className={`text-xs ${
                  initStatus === 'complete' ? 'text-emerald-400' :
                  initStatus === 'error' ? 'text-red-400' :
                  initStatus === 'processing' ? 'text-blue-400' :
                  'text-slate-500'
                }`}>{initStatus}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2 bg-slate-900/30 rounded border border-slate-800/30">
                <div className="flex items-center gap-2">
                  {getStatusIcon(compileStatus)}
                  <span className="text-xs text-slate-300">Compile</span>
                </div>
                <span className={`text-xs ${
                  compileStatus === 'complete' ? 'text-emerald-400' :
                  compileStatus === 'error' ? 'text-red-400' :
                  compileStatus === 'processing' ? 'text-yellow-400' :
                  'text-slate-500'
                }`}>{compileStatus}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 px-2 bg-slate-900/30 rounded border border-slate-800/30">
                <div className="flex items-center gap-2">
                  {getStatusIcon(deployStatus)}
                  <span className="text-xs text-slate-300">Deploy</span>
                </div>
                <span className={`text-xs ${
                  deployStatus === 'complete' ? 'text-emerald-400' :
                  deployStatus === 'error' ? 'text-red-400' :
                  deployStatus === 'processing' ? 'text-amber-400' :
                  'text-slate-500'
                }`}>{deployStatus}</span>
              </div>
            </div>
          </div>


          <div className="border-t border-slate-800/50 my-3"></div>

          {/* Actions - Minimal */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</span>
            </div>
            <div className="space-y-2 flex gap-1">
                <Button 
                  onClick={initializeProject} 
                  disabled={loading || !code.trim()}
                  className="bg-gradient-to-r w-1/3 from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white"
                >
                  {initStatus === 'processing' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Initialize
                </Button>
                <Button
                  onClick={compilePackage}
                  disabled={compileButtonDisabled || loading || !code.trim()}
                  className="bg-gradient-to-r w-1/3 from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 text-white"
                >
                  {compileStatus === 'processing' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Code className="w-4 h-4" />
                  )}
                  Compile
                </Button>
                <Button
                  onClick={deployPackage}
                  disabled={deployButtonDisabled || loading || !code.trim()}
                  className="bg-gradient-to-r w-1/3 from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white"
                >
                  {deployStatus === 'processing' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Deploy
                </Button>
              </div>
          </div>

          <div className="border-t border-slate-800/50 my-3"></div>

          {/* Address and Transaction Info */}
          {currentData && (currentData.address || currentData.transactionHash) && (
            <div className="mt-3 space-y-2">
              {currentData.address && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase tracking-wider">Address</label>
                  <div className="p-2 bg-slate-900/50 rounded border border-slate-800/50">
                    <code className="text-xs text-slate-300 font-mono break-all">
                      {currentData.address}
                    </code>
                  </div>
                </div>
              )}
              {currentData.transactionHash && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 uppercase tracking-wider">Transaction Hash</label>
                  <div className="p-2 bg-slate-900/50 rounded border border-slate-800/50">
                    <code className="text-xs text-slate-300 font-mono break-all">
                      {currentData.transactionHash}
                    </code>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Links - Minimal */}
          {currentData && (currentData.address || currentData.explorerUrls) && (
            <>
              <div className="border-t border-slate-800/50 my-3"></div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Links</span>
                </div>
                {currentData.explorerUrls?.account && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full h-7 justify-start border-slate-700/50 text-slate-300 hover:bg-amber-500/10 text-xs"
                  >
                    <a href={currentData.explorerUrls.account} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3.5" />
                      Account
                    </a>
                  </Button>
                )}
                {currentData.explorerUrls?.transaction && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full h-7 justify-start border-slate-700/50 text-slate-300 hover:bg-amber-500/10 text-xs"
                  >
                    <a href={currentData.explorerUrls.transaction} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3.5" />
                      Transaction
                    </a>
                  </Button>
                )}
                {currentData.address && (
                  <>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full h-7 justify-start border-slate-700/50 text-slate-300 hover:bg-blue-500/10 text-xs"
                  >
                    <a href={`https://faucet.movementnetwork.xyz/?address=${currentData.address}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3.5" />
                      Faucet
                    </a>
                  </Button>
                  </>
                )}
              </div>
            </>
          )}
          <div className="border-t border-slate-800/50 my-3"></div>
          {/* Response Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Code className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Response</span>
            </div>
            <div className="max-h-32 overflow-y-auto bg-slate-900/50 rounded border border-slate-800/50 p-2">
              {latestResponse ? (
                <p className="text-xs text-slate-300 font-mono break-all whitespace-pre-wrap">{latestResponse}</p>
              ) : (
                <p className="text-xs text-slate-500 italic">No response yet</p>
              )}
            </div>
          </div>

          {/* Raw Response Section */}
          <div className="space-y-2 pb-10">
            <div className="flex items-center gap-2 mb-2">
              <Code className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Raw Response</span>
            </div>
            <div className="max-h-40 overflow-y-auto bg-slate-950/50 rounded border border-slate-800/50 p-2">
              {rawResponse ? (
                <pre className="text-xs text-slate-300 font-mono whitespace-pre">{rawResponse}</pre>
              ) : (
                <p className="text-xs text-slate-500 italic">No data yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

