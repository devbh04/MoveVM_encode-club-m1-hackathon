import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Copy,
  ChevronDown,
  ChevronUp,
  Upload
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useSearchParams } from 'react-router-dom';

// Simple date formatter (date-fns alternative)
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function DeploymentHistoryPanel() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [projectData, setProjectData] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('project');

  // Load project data from MongoDB
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
        setProjectData(data.project);
      }
    } catch (error) {
      console.error('Error loading project data:', error);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'init':
        return 'bg-blue-600/20 text-blue-400 border-blue-500/30';
      case 'compile':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30';
      case 'deploy':
        return 'bg-amber-600/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-slate-600/20 text-slate-400 border-slate-500/30';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0e1a] border-t border-slate-800/50">
      <div className="p-4 border-b border-slate-800/50">
        <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Deployment History
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          From database
        </p>
      </div>

      <div className="p-4 space-y-3 overflow-hidden overflow-y-auto">
        {/* Display all deployment history entries from MongoDB */}
        {projectData?.deploymentHistory && projectData.deploymentHistory.length > 0 ? (
          // Sort by timestamp, newest first
          [...projectData.deploymentHistory]
            .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .map((entry: any, index: number) => (
            <div key={`${entry.type}-${entry.timestamp}-${index}`} className="bg-slate-900/50 border border-slate-800/50 rounded-lg overflow-hidden">
              <div
                className="p-3 cursor-pointer hover:bg-slate-800/30 transition-colors"
                onClick={() => toggleExpand(`${entry.type}-${entry.timestamp}-${index}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {entry.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${getTypeColor(entry.type)} text-xs uppercase`}>
                          {entry.type}
                        </Badge>
                        <span className="text-sm text-slate-300">
                          {entry.status === 'success' ? 'Success' : 'Failed'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {entry.timestamp ? formatDate(new Date(entry.timestamp)) : 'Recently'}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    {expandedItems.has(`${entry.type}-${entry.timestamp}-${index}`) ? <ChevronUp className="w-4 h-4 text-white" /> : <ChevronDown className="w-4 h-4 text-white" />}
                  </Button>
                </div>
              </div>

              {expandedItems.has(`${entry.type}-${entry.timestamp}-${index}`) && (
                <div className="px-3 pb-3 space-y-2 border-t border-slate-800/50">
                  {entry.data.address && (
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 uppercase">Address</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 font-mono break-all">
                          {entry.data.address}
                        </code>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(entry.data.address)} className="h-7 w-7 p-0">
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {entry.data.moduleName && (
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 uppercase">Module</label>
                      <code className="block px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 font-mono">
                        {entry.data.moduleName}
                      </code>
                    </div>
                  )}
                  {entry.data.transactionHash && (
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 uppercase">Transaction Hash</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 font-mono break-all">
                          {entry.data.transactionHash}
                        </code>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(entry.data.transactionHash)} className="h-7 w-7 p-0">
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {entry.data.log && (
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 uppercase">Log</label>
                      <pre className="px-2 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-400 font-mono max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {entry.data.log}
                      </pre>
                    </div>
                  )}
                  {entry.data.error && (
                    <div className="space-y-1">
                      <label className="text-xs text-red-500 uppercase">Error</label>
                      <pre className="px-2 py-1.5 bg-red-950/20 border border-red-800/50 rounded text-xs text-red-400 font-mono max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {entry.data.error}
                      </pre>
                    </div>
                  )}
                  {entry.data.faucetUrl && (
                    <Button variant="outline" size="sm" asChild className="w-full border-slate-700 text-slate-300 hover:bg-blue-500/10">
                      <a href={entry.data.faucetUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-2" />
                        Request Funds
                      </a>
                    </Button>
                  )}
                  {entry.data.explorerUrls && (
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 uppercase">Explorer Links</label>
                      {entry.data.explorerUrls.account && (
                        <Button variant="outline" size="sm" asChild className="w-full border-slate-700 text-slate-300 hover:bg-amber-500/10">
                          <a href={entry.data.explorerUrls.account} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3 mr-2" />
                            View Account
                          </a>
                        </Button>
                      )}
                      {entry.data.explorerUrls.transaction && (
                        <Button variant="outline" size="sm" asChild className="w-full border-slate-700 text-slate-300 hover:bg-amber-500/10">
                          <a href={entry.data.explorerUrls.transaction} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3 mr-2" />
                            View Transaction
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Upload className="w-12 h-12 mx-auto mb-3 text-slate-700" />
            <p className="text-sm text-slate-500">No deployment history yet</p>
            <p className="text-xs text-slate-400 mt-1">Initialize your project to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

