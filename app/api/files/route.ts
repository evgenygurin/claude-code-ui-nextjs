import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

// Allowed directories for file operations (security measure)
const ALLOWED_DIRECTORIES = [
  process.cwd(),
  path.join(process.cwd(), 'src'),
  path.join(process.cwd(), 'components'),
  path.join(process.cwd(), 'app'),
  path.join(process.cwd(), 'docs'),
  path.join(process.cwd(), 'public')
];

function isPathAllowed(filePath: string): boolean {
  const normalizedPath = path.resolve(filePath);
  return ALLOWED_DIRECTORIES.some(allowedDir => 
    normalizedPath.startsWith(path.resolve(allowedDir))
  );
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dirPath = searchParams.get('path') || process.cwd();
    const action = searchParams.get('action') || 'list';

    if (!isPathAllowed(dirPath)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (action === 'list') {
      // List directory contents
      try {
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        const fileList = await Promise.all(
          items.map(async (item) => {
            const fullPath = path.join(dirPath, item.name);
            const stats = await fs.stat(fullPath);
            
            return {
              id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: item.name,
              type: item.isDirectory() ? 'folder' : 'file',
              size: item.isFile() ? stats.size : undefined,
              modified: stats.mtime,
              path: fullPath,
              isHidden: item.name.startsWith('.')
            };
          })
        );

        return NextResponse.json({
          path: dirPath,
          files: fileList,
          count: fileList.length
        });
      } catch (error) {
        return NextResponse.json({ error: 'Failed to read directory' }, { status: 500 });
      }
    }

    if (action === 'read') {
      // Read file content
      const filePath = dirPath;
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const stats = await fs.stat(filePath);
        
        return NextResponse.json({
          path: filePath,
          content,
          size: stats.size,
          modified: stats.mtime,
          encoding: 'utf-8'
        });
      } catch (error) {
        return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Files API GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, path: filePath, content, name, type } = await request.json();

    if (!isPathAllowed(filePath)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    switch (action) {
      case 'create':
        // Create new file or folder
        try {
          const fullPath = path.join(filePath, name);
          
          if (type === 'folder') {
            await fs.mkdir(fullPath, { recursive: true });
            return NextResponse.json({
              message: 'Folder created',
              path: fullPath,
              type: 'folder'
            });
          } else {
            await fs.writeFile(fullPath, content || '', 'utf-8');
            return NextResponse.json({
              message: 'File created',
              path: fullPath,
              type: 'file'
            });
          }
        } catch (error) {
          return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
        }

      case 'write':
        // Write to existing file
        try {
          await fs.writeFile(filePath, content, 'utf-8');
          const stats = await fs.stat(filePath);
          
          return NextResponse.json({
            message: 'File written',
            path: filePath,
            size: stats.size,
            modified: stats.mtime
          });
        } catch (error) {
          return NextResponse.json({ error: 'Failed to write file' }, { status: 500 });
        }

      case 'copy':
        // Copy file or folder
        const { destination } = await request.json();
        if (!isPathAllowed(destination)) {
          return NextResponse.json({ error: 'Destination access denied' }, { status: 403 });
        }
        
        try {
          await fs.copyFile(filePath, destination);
          return NextResponse.json({
            message: 'File copied',
            source: filePath,
            destination
          });
        } catch (error) {
          return NextResponse.json({ error: 'Failed to copy file' }, { status: 500 });
        }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Files API POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 });
    }

    if (!isPathAllowed(filePath)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    try {
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        await fs.rmdir(filePath, { recursive: true });
        return NextResponse.json({
          message: 'Directory deleted',
          path: filePath,
          type: 'directory'
        });
      } else {
        await fs.unlink(filePath);
        return NextResponse.json({
          message: 'File deleted',
          path: filePath,
          type: 'file'
        });
      }
    } catch (error) {
      return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }

  } catch (error) {
    console.error('Files API DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}