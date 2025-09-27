'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  FolderOpen,
  FileText,
  Image,
  Music,
  Video,
  Archive,
  Code,
  Settings,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  lastModified?: Date;
  children?: FileNode[];
  isExpanded?: boolean;
}

const mockFileTree: FileNode = {
  id: 'root',
  name: 'project-root',
  type: 'folder',
  path: '/',
  isExpanded: true,
  children: [
    {
      id: 'src',
      name: 'src',
      type: 'folder',
      path: '/src',
      isExpanded: true,
      children: [
        {
          id: 'components',
          name: 'components',
          type: 'folder',
          path: '/src/components',
          isExpanded: false,
          children: [
            {
              id: 'header',
              name: 'Header.tsx',
              type: 'file',
              path: '/src/components/Header.tsx',
              size: 2048,
            },
            {
              id: 'sidebar',
              name: 'Sidebar.tsx',
              type: 'file',
              path: '/src/components/Sidebar.tsx',
              size: 4096,
            },
          ],
        },
        {
          id: 'app',
          name: 'App.tsx',
          type: 'file',
          path: '/src/App.tsx',
          size: 1024,
        },
        {
          id: 'main',
          name: 'main.tsx',
          type: 'file',
          path: '/src/main.tsx',
          size: 512,
        },
      ],
    },
    {
      id: 'public',
      name: 'public',
      type: 'folder',
      path: '/public',
      isExpanded: false,
      children: [
        {
          id: 'favicon',
          name: 'favicon.ico',
          type: 'file',
          path: '/public/favicon.ico',
          size: 32768,
        },
        {
          id: 'logo',
          name: 'logo.svg',
          type: 'file',
          path: '/public/logo.svg',
          size: 8192,
        },
      ],
    },
    {
      id: 'package',
      name: 'package.json',
      type: 'file',
      path: '/package.json',
      size: 2048,
    },
    {
      id: 'readme',
      name: 'README.md',
      type: 'file',
      path: '/README.md',
      size: 4096,
    },
    {
      id: 'tsconfig',
      name: 'tsconfig.json',
      type: 'file',
      path: '/tsconfig.json',
      size: 1024,
    },
  ],
};

export default function FileExplorer() {
  const [fileTree, setFileTree] = useState<FileNode>(mockFileTree);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);

  const getFileIcon = (
    fileName: string,
    isFolder: boolean,
    isExpanded?: boolean
  ) => {
    if (isFolder) {
      return isExpanded ? FolderOpen : Folder;
    }

    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'tsx':
      case 'ts':
      case 'js':
      case 'jsx':
        return Code;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return Image;
      case 'mp3':
      case 'wav':
      case 'ogg':
        return Music;
      case 'mp4':
      case 'avi':
      case 'mov':
        return Video;
      case 'zip':
      case 'rar':
      case '7z':
        return Archive;
      case 'json':
      case 'md':
      case 'txt':
        return FileText;
      default:
        return FileText;
    }
  };

  const getIconColor = (fileName: string, isFolder: boolean) => {
    if (isFolder) return 'text-blue-500';

    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'tsx':
      case 'ts':
        return 'text-blue-400';
      case 'js':
      case 'jsx':
        return 'text-yellow-500';
      case 'css':
      case 'scss':
        return 'text-pink-500';
      case 'html':
        return 'text-orange-500';
      case 'json':
        return 'text-green-500';
      case 'md':
        return 'text-gray-500';
      default:
        return 'text-gray-400';
    }
  };

  const toggleNode = (nodeId: string, tree: FileNode): FileNode => {
    if (tree.id === nodeId) {
      return { ...tree, isExpanded: !tree.isExpanded };
    }

    if (tree.children) {
      return {
        ...tree,
        children: tree.children.map(child => toggleNode(nodeId, child)),
      };
    }

    return tree;
  };

  const handleNodeClick = (nodeId: string, node: FileNode) => {
    if (node.type === 'folder') {
      setFileTree(prev => toggleNode(nodeId, prev));
    } else {
      setSelectedFile(nodeId);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      nodeId,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const renderNode = (node: FileNode, depth = 0) => {
    const Icon = getFileIcon(
      node.name,
      node.type === 'folder',
      node.isExpanded
    );
    const iconColor = getIconColor(node.name, node.type === 'folder');
    const isSelected = selectedFile === node.id;

    return (
      <div key={node.id} className="select-none">
        <motion.div
          initial={false}
          whileHover={{ backgroundColor: 'hsl(var(--accent))' }}
          className={cn(
            'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1',
            isSelected && 'bg-accent'
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleNodeClick(node.id, node)}
          onContextMenu={e => handleContextMenu(e, node.id)}
        >
          {node.type === 'folder' && (
            <motion.div
              animate={{ rotate: node.isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex h-4 w-4 items-center justify-center"
            >
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            </motion.div>
          )}

          {node.type === 'file' && <div className="w-4" />}

          <Icon className={cn('h-4 w-4', iconColor)} />

          <span className="flex-1 truncate text-sm">{node.name}</span>

          {node.size && (
            <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
              {formatFileSize(node.size)}
            </span>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={e => {
              e.stopPropagation();
              handleContextMenu(e, node.id);
            }}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </motion.div>

        <AnimatePresence>
          {node.type === 'folder' && node.isExpanded && node.children && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {node.children.map(child => renderNode(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-card/30 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Folder className="h-5 w-5 text-blue-500" />
          <h2 className="font-semibold">File Explorer</h2>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-md border bg-background py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* File Tree */}
      <div className="custom-scrollbar flex-1 overflow-y-auto p-2">
        {renderNode(fileTree)}
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 min-w-[160px] rounded-md border bg-card py-1 shadow-lg"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            <button className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent">
              <Edit className="h-4 w-4" />
              Rename
            </button>
            <button className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent">
              <Copy className="h-4 w-4" />
              Copy
            </button>
            <button className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent">
              <Download className="h-4 w-4" />
              Download
            </button>
            <div className="my-1 border-t" />
            <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent">
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
