import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { getApiUrl } from '../lib/config';
import EnvironmentIndicator from '../components/EnvironmentIndicator';
import { 
  Code, 
  Plus, 
  Trash2, 
  FileCode, 
  Clock, 
  CheckCircle2, 
  Folder,
  ExternalLink,
  Search
} from "lucide-react";

interface Project {
  _id: string;
  name: string;
  code: string;
  status: string;
  networkType: string;
  createdAt: string;
  lastModified: string;
  initData?: {
    address: string;
    timestamp: string;
  };
  compileData?: {
    success: boolean;
    timestamp: string;
  };
  deployData?: {
    success: boolean;
    transactionHash: string;
    address: string;
    explorerUrl: string;
    timestamp: string;
  };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch(getApiUrl('projects'));
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      const response = await fetch(getApiUrl('projects'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newProjectName,
          code: '// Write your Move smart contract here\n'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setNewProjectName('');
        setIsCreating(false);
        navigate(`/builder?project=${data.project._id}`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const response = await fetch(getApiUrl(`projects/${id}`), {
        method: 'DELETE'
      });
      
      if (response.ok) {
        fetchProjects();
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const openProject = (id: string) => {
    navigate(`/builder?project=${id}`);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      created: { label: 'Created', className: 'bg-neutral-700 text-neutral-300' },
      initialized: { label: 'Initialized', className: 'bg-blue-600/20 text-blue-400 border-blue-500/50' },
      compiled: { label: 'Compiled', className: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/50' },
      deployed: { label: 'Deployed', className: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50' }
    };

    const variant = variants[status] || variants.created;
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    );
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/95 backdrop-blur-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Folder className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-yellow-400">
                  Project Dashboard
                </h1>
                <p className="text-xs text-neutral-400 font-mono">Manage your Move contracts</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <EnvironmentIndicator />
            
            <Button 
              onClick={() => setIsCreating(true)}
              className="bg-linear-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-neutral-900 border-neutral-800 text-neutral-200"
            />
          </div>
        </div>

        {/* Create Project Modal */}
        {isCreating && (
          <Card className="mb-6 bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-neutral-200">Create New Project</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-3">
                <Input
                  placeholder="Project name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createProject()}
                  className="bg-neutral-950 border-neutral-700 text-neutral-200"
                  autoFocus
                />
                <Button onClick={createProject} className="bg-blue-600 hover:bg-blue-500">
                  Create
                </Button>
                <Button onClick={() => setIsCreating(false)} variant="outline" className="border-neutral-700 text-neutral-300">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects Grid */}
        {loading ? (
          <div className="text-center py-12 text-neutral-400">Loading projects...</div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <FileCode className="w-16 h-16 mx-auto text-neutral-700 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-300 mb-2">
              {searchQuery ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-neutral-500 mb-4">
              {searchQuery ? 'Try a different search term' : 'Create your first Move smart contract project'}
            </p>
            {!searchQuery && (
              <Button 
                onClick={() => setIsCreating(true)}
                className="bg-linear-to-r from-blue-600 to-yellow-600 hover:from-blue-500 hover:to-yellow-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <Card 
                key={project._id} 
                className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 transition-all cursor-pointer group"
                onClick={() => openProject(project._id)}
              >
                <CardHeader className="">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-neutral-200 mb-2 flex items-center group-hover:text-blue-400 transition-colors">
                        <Code className="w-4 h-4 mr-2" />
                        {project.name}
                      </CardTitle>
                      {getStatusBadge(project.status)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-neutral-500 hover:text-red-400 hover:bg-red-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(project._id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Network */}
                  <div className="flex items-center text-sm text-neutral-400">
                    <span className="font-mono">Network:</span>
                    <Badge variant="outline" className="ml-2 text-xs border-neutral-700 text-neutral-300">
                      {project.networkType}
                    </Badge>
                  </div>

                  {/* Progress Indicators */}
                  <div className="flex items-center space-x-4">
                    {project.initData && (
                      <div className="flex items-center text-xs text-emerald-400">
                        <CheckCircle2 className="w-3 h-3 mr-2" />
                        Initialized
                      </div>
                    )}
                    {project.compileData?.success && (
                      <div className="flex items-center text-xs text-emerald-400">
                        <CheckCircle2 className="w-3 h-3 mr-2" />
                        Compiled
                      </div>
                    )}
                    {project.deployData?.success && (
                      <div className="flex items-center text-xs text-emerald-400">
                        <CheckCircle2 className="w-3 h-3 mr-2" />
                        Deployed
                        {project.deployData.explorerUrl && (
                          <a
                            href={project.deployData.explorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-auto text-blue-400 hover:text-blue-300"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3 ml-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Timestamps */}
                  <div className="pt-2 border-t border-neutral-800">
                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Modified
                      </span>
                      <span>{new Date(project.lastModified).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
