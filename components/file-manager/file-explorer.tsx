'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Folder,
  FolderOpen,
  File,
  Plus,
  MoreHorizontal,
  Search,
  Download,
  Upload,
  Trash2,
  Edit3,
  Copy,
  Cut,
  Home,
  ChevronRight,
  RefreshCw,
  FileText,
  Code,
  Image,
  Archive,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  modified: Date;
  path: string;
  children?: FileItem[];
  isExpanded?: boolean;
  parent?: string;
}

interface FileExplorerProps {
  className?: string;
  initialFiles?: FileItem[];
  onFileSelect?: (file: FileItem) => void;
  onFileAction?: (action: string, file: FileItem) => void;
  allowUpload?: boolean;
  allowCreate?: boolean;
  allowDelete?: boolean;
}

export function FileExplorer({
  className,
  initialFiles = [],
  onFileSelect,
  onFileAction,
  allowUpload = true,
  allowCreate = true,
  allowDelete = true
}: FileExplorerProps) {
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState('/');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'folder'>('file');
  const [newItemName, setNewItemName] = useState('');
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<FileItem | null>(null);

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') {
      return file.isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
      case 'php':
      case 'rb':
      case 'go':
      case 'rs':
        return <Code className="h-4 w-4" />;
      case 'txt':
      case 'md':
      case 'doc':
      case 'docx':
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'ico':
        return <Image className="h-4 w-4" />;
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return <Archive className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const toggleFolder = useCallback((fileId: string) => {
    setFiles(prev => 
      prev.map(file => 
        file.id === fileId 
          ? { ...file, isExpanded: !file.isExpanded }
          : file
      )
    );
  }, []);

  const handleFileClick = useCallback((file: FileItem) => {
    if (file.type === 'folder') {
      toggleFolder(file.id);
    } else {
      setSelectedFile(file.id);
      onFileSelect?.(file);
    }
  }, [toggleFolder, onFileSelect]);

  const handleCreateItem = () => {
    if (!newItemName.trim()) return;

    const newItem: FileItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      type: createType,
      modified: new Date(),
      path: `${currentPath}${newItemName.trim()}`,
      ...(createType === 'folder' && { children: [], isExpanded: false })
    };

    setFiles(prev => [...prev, newItem]);
    onFileAction?.('create', newItem);
    
    setNewItemName('');
    setIsCreateDialogOpen(false);
  };

  const handleDelete = (file: FileItem) => {
    setFiles(prev => prev.filter(f => f.id !== file.id));
    onFileAction?.('delete', file);
    setDeleteConfirmFile(null);
  };

  const handleFileAction = (action: string, file: FileItem) => {
    switch (action) {
      case 'delete':
        setDeleteConfirmFile(file);
        break;
      case 'download':
      case 'copy':
      case 'cut':
      case 'rename':
        onFileAction?.(action, file);
        break;
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const breadcrumbParts = currentPath.split('/').filter(Boolean);

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="flex-shrink-0 pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            File Explorer
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFiles([...files])}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {allowCreate && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    onClick={() => {
                      setCreateType('file');
                      setIsCreateDialogOpen(true);
                    }}
                  >
                    <File className="h-4 w-4 mr-2" />
                    New File
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setCreateType('folder');
                      setIsCreateDialogOpen(true);
                    }}
                  >
                    <Folder className="h-4 w-4 mr-2" />
                    New Folder
                  </DropdownMenuItem>
                  {allowUpload && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Files
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 gap-4 p-4 pt-0">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCurrentPath('/')}
            className="h-6 px-2"
          >
            <Home className="h-3 w-3" />
          </Button>
          {breadcrumbParts.map((part, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="h-3 w-3" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCurrentPath(`/${breadcrumbParts.slice(0, index + 1).join('/')}/`)}
                className="h-6 px-2"
              >
                {part}
              </Button>
            </React.Fragment>
          ))}
        </div>

        {/* File List */}
        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {filteredFiles.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No files found</p>
              </div>
            ) : (
              filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer transition-colors",
                    selectedFile === file.id && "bg-muted"
                  )}
                  onClick={() => handleFileClick(file)}
                >
                  <div className="flex-shrink-0 text-muted-foreground">
                    {getFileIcon(file)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{file.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{file.modified.toLocaleDateString()}</span>
                      {file.size && <span>{formatFileSize(file.size)}</span>}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleFileAction('download', file)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleFileAction('copy', file)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleFileAction('cut', file)}>
                        <Cut className="h-4 w-4 mr-2" />
                        Cut
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleFileAction('rename', file)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      {allowDelete && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleFileAction('delete', file)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create New {createType === 'file' ? 'File' : 'Folder'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={`Enter ${createType} name...`}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateItem()}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateItem}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirmFile}
        onOpenChange={() => setDeleteConfirmFile(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteConfirmFile?.type}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirmFile?.name}"?
              {deleteConfirmFile?.type === 'folder' && 
                ' This will also delete all files inside this folder.'
              }
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmFile && handleDelete(deleteConfirmFile)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}