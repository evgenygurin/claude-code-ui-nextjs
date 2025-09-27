/**
 * Figma Integration for CodeGen
 *
 * Capabilities according to CodeGen docs:
 * - Access design specifications
 * - Extract design assets
 * - Convert designs to code
 * - Sync design changes
 *
 * Permissions Required:
 * - Read user profile information
 * - Access file contents and nodes
 * - Read file metadata and version history
 * - View file comments
 * - Access design variables and tokens
 * - Read published components and styles
 * - Access team library content
 *
 * How Agents Use Figma:
 * - Analyze design files
 * - Generate frontend code
 * - Pull icons and images
 * - Maintain design system consistency
 *
 * Note: Requires feature flag and team administrator enablement
 */

interface FigmaIntegrationConfig {
  accessToken: string;
  teamId?: string;
}

interface FigmaFile {
  key: string;
  name: string;
  thumbnail_url: string;
  last_modified: string;
  version: string;
  document: FigmaNode;
  components: Record<string, FigmaComponent>;
  componentSets: Record<string, FigmaComponentSet>;
  schemaVersion: number;
  styles: Record<string, FigmaStyle>;
}

interface FigmaNode {
  id: string;
  name: string;
  type: 'DOCUMENT' | 'CANVAS' | 'FRAME' | 'GROUP' | 'VECTOR' | 'BOOLEAN_OPERATION' | 'STAR' | 'LINE' | 'ELLIPSE' | 'POLYGON' | 'RECTANGLE' | 'TEXT' | 'SLICE' | 'COMPONENT' | 'COMPONENT_SET' | 'INSTANCE' | 'STICKY' | 'SHAPE_WITH_TEXT' | 'CONNECTOR';
  visible?: boolean;
  children?: FigmaNode[];
  backgroundColor?: FigmaColor;
  fills?: FigmaPaint[];
  strokes?: FigmaPaint[];
  strokeWeight?: number;
  strokeAlign?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  cornerRadius?: number;
  width?: number;
  height?: number;
  constraints?: {
    vertical: 'TOP' | 'BOTTOM' | 'CENTER' | 'TOP_BOTTOM' | 'SCALE';
    horizontal: 'LEFT' | 'RIGHT' | 'CENTER' | 'LEFT_RIGHT' | 'SCALE';
  };
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  itemSpacing?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  primaryAxisSizingMode?: 'FIXED' | 'AUTO';
  counterAxisSizingMode?: 'FIXED' | 'AUTO';
  primaryAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems?: 'MIN' | 'CENTER' | 'MAX';
  characters?: string;
  style?: FigmaTypeStyle;
  characterStyleOverrides?: number[];
  styleOverrideTable?: Record<string, FigmaTypeStyle>;
}

interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface FigmaPaint {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE' | 'EMOJI';
  visible?: boolean;
  opacity?: number;
  color?: FigmaColor;
  gradientHandlePositions?: Array<{ x: number; y: number }>;
  gradientStops?: Array<{ position: number; color: FigmaColor }>;
  scaleMode?: 'FILL' | 'FIT' | 'CROP' | 'TILE';
  imageRef?: string;
}

interface FigmaTypeStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  paragraphSpacing?: number;
  paragraphIndent?: number;
  italic?: boolean;
  fontWeight: number;
  fontSize: number;
  textCase?: 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE';
  textDecoration?: 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
  textAlignHorizontal?: 'LEFT' | 'RIGHT' | 'CENTER' | 'JUSTIFIED';
  textAlignVertical?: 'TOP' | 'CENTER' | 'BOTTOM';
  letterSpacing?: number;
  lineHeightPx?: number;
  lineHeightPercent?: number;
  lineHeightPercentFontSize?: number;
  lineHeightUnit?: 'PIXELS' | 'FONT_SIZE_%' | 'INTRINSIC_%';
}

interface FigmaComponent {
  key: string;
  name: string;
  description: string;
  componentSetId?: string;
  documentationLinks: Array<{ uri: string }>;
}

interface FigmaComponentSet {
  key: string;
  name: string;
  description: string;
  documentationLinks: Array<{ uri: string }>;
}

interface FigmaStyle {
  key: string;
  name: string;
  description: string;
  styleType: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID';
}

interface FigmaTeam {
  id: string;
  name: string;
}

interface FigmaProject {
  id: string;
  name: string;
}

interface FigmaFileMetadata {
  key: string;
  name: string;
  thumbnail_url: string;
  last_modified: string;
}

interface FigmaComment {
  id: string;
  file_key: string;
  parent_id: string;
  user: {
    id: string;
    handle: string;
    img_url: string;
  };
  created_at: string;
  resolved_at?: string;
  message: string;
  client_meta: {
    x?: number;
    y?: number;
    node_id?: string;
    node_offset?: { x: number; y: number };
  };
}

interface DesignToCodeConversion {
  componentName: string;
  framework: 'react' | 'vue' | 'angular' | 'svelte' | 'html';
  code: string;
  styles: string;
  assets: Array<{
    name: string;
    url: string;
    type: 'image' | 'icon' | 'font';
  }>;
  designTokens: Record<string, any>;
}

export class FigmaIntegration {
  private accessToken: string;
  private teamId?: string;
  private baseUrl = 'https://api.figma.com/v1';

  constructor(config: FigmaIntegrationConfig) {
    this.accessToken = config.accessToken;
    this.teamId = config.teamId;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'X-Figma-Token': this.accessToken,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Figma API error (${response.status}): ${errorText}`
      );
    }

    return response.json();
  }

  // User and Team Management
  async getUser(): Promise<any> {
    try {
      return await this.request('/me');
    } catch (error) {
      throw new Error(`Failed to get user: ${error}`);
    }
  }

  async getTeamProjects(teamId?: string): Promise<FigmaProject[]> {
    const team = teamId || this.teamId;
    if (!team) {
      throw new Error('Team ID must be provided');
    }

    try {
      const data = await this.request<{ projects: FigmaProject[] }>(
        `/teams/${team}/projects`
      );
      return data.projects;
    } catch (error) {
      throw new Error(`Failed to get team projects: ${error}`);
    }
  }

  async getProjectFiles(projectId: string): Promise<FigmaFileMetadata[]> {
    try {
      const data = await this.request<{ files: FigmaFileMetadata[] }>(
        `/projects/${projectId}/files`
      );
      return data.files;
    } catch (error) {
      throw new Error(`Failed to get project files: ${error}`);
    }
  }

  // File Management
  async getFile(fileKey: string, options?: {
    version?: string;
    ids?: string[];
    depth?: number;
    geometry?: 'paths' | 'outlines';
    plugin_data?: string;
    branch_data?: boolean;
  }): Promise<FigmaFile> {
    try {
      const params = new URLSearchParams();
      if (options?.version) params.append('version', options.version);
      if (options?.ids) params.append('ids', options.ids.join(','));
      if (options?.depth) params.append('depth', options.depth.toString());
      if (options?.geometry) params.append('geometry', options.geometry);
      if (options?.plugin_data) params.append('plugin_data', options.plugin_data);
      if (options?.branch_data) params.append('branch_data', 'true');

      const queryString = params.toString();
      const endpoint = `/files/${fileKey}${queryString ? `?${queryString}` : ''}`;

      return await this.request<FigmaFile>(endpoint);
    } catch (error) {
      throw new Error(`Failed to get file: ${error}`);
    }
  }

  async getFileNodes(
    fileKey: string,
    nodeIds: string[],
    options?: {
      version?: string;
      depth?: number;
      geometry?: 'paths' | 'outlines';
      plugin_data?: string;
    }
  ): Promise<{ nodes: Record<string, FigmaNode> }> {
    try {
      const params = new URLSearchParams();
      params.append('ids', nodeIds.join(','));
      if (options?.version) params.append('version', options.version);
      if (options?.depth) params.append('depth', options.depth.toString());
      if (options?.geometry) params.append('geometry', options.geometry);
      if (options?.plugin_data) params.append('plugin_data', options.plugin_data);

      const queryString = params.toString();
      const endpoint = `/files/${fileKey}/nodes?${queryString}`;

      return await this.request<{ nodes: Record<string, FigmaNode> }>(endpoint);
    } catch (error) {
      throw new Error(`Failed to get file nodes: ${error}`);
    }
  }

  async getImages(
    fileKey: string,
    nodeIds: string[],
    options?: {
      scale?: number;
      format?: 'jpg' | 'png' | 'svg' | 'pdf';
      svg_include_id?: boolean;
      svg_simplify_stroke?: boolean;
      use_absolute_bounds?: boolean;
      version?: string;
    }
  ): Promise<{ images: Record<string, string> }> {
    try {
      const params = new URLSearchParams();
      params.append('ids', nodeIds.join(','));
      if (options?.scale) params.append('scale', options.scale.toString());
      if (options?.format) params.append('format', options.format);
      if (options?.svg_include_id) params.append('svg_include_id', 'true');
      if (options?.svg_simplify_stroke) params.append('svg_simplify_stroke', 'true');
      if (options?.use_absolute_bounds) params.append('use_absolute_bounds', 'true');
      if (options?.version) params.append('version', options.version);

      const queryString = params.toString();
      const endpoint = `/images/${fileKey}?${queryString}`;

      return await this.request<{ images: Record<string, string> }>(endpoint);
    } catch (error) {
      throw new Error(`Failed to get images: ${error}`);
    }
  }

  // Comments Management
  async getComments(fileKey: string): Promise<FigmaComment[]> {
    try {
      const data = await this.request<{ comments: FigmaComment[] }>(
        `/files/${fileKey}/comments`
      );
      return data.comments;
    } catch (error) {
      throw new Error(`Failed to get comments: ${error}`);
    }
  }

  async postComment(
    fileKey: string,
    message: string,
    client_meta: {
      x?: number;
      y?: number;
      node_id?: string;
      node_offset?: { x: number; y: number };
    }
  ): Promise<FigmaComment> {
    try {
      return await this.request<FigmaComment>(
        `/files/${fileKey}/comments`,
        {
          method: 'POST',
          body: JSON.stringify({ message, client_meta }),
        }
      );
    } catch (error) {
      throw new Error(`Failed to post comment: ${error}`);
    }
  }

  // Design System and Components
  async getComponentSets(fileKey: string): Promise<Record<string, FigmaComponentSet>> {
    try {
      const file = await this.getFile(fileKey);
      return file.componentSets;
    } catch (error) {
      throw new Error(`Failed to get component sets: ${error}`);
    }
  }

  async getComponents(fileKey: string): Promise<Record<string, FigmaComponent>> {
    try {
      const file = await this.getFile(fileKey);
      return file.components;
    } catch (error) {
      throw new Error(`Failed to get components: ${error}`);
    }
  }

  async getStyles(fileKey: string): Promise<Record<string, FigmaStyle>> {
    try {
      const file = await this.getFile(fileKey);
      return file.styles;
    } catch (error) {
      throw new Error(`Failed to get styles: ${error}`);
    }
  }

  // Design to Code Conversion (CodeGen specific features)
  async convertToCode(
    fileKey: string,
    nodeId: string,
    framework: 'react' | 'vue' | 'angular' | 'svelte' | 'html' = 'react'
  ): Promise<DesignToCodeConversion> {
    try {
      // Get the specific node
      const nodeData = await this.getFileNodes(fileKey, [nodeId]);
      const node = nodeData.nodes[nodeId];

      if (!node) {
        throw new Error(`Node ${nodeId} not found`);
      }

      // Extract design tokens
      const designTokens = this.extractDesignTokens(node);

      // Generate component name
      const componentName = this.sanitizeComponentName(node.name);

      // Generate code based on framework
      const { code, styles } = this.generateCode(node, framework, designTokens);

      // Extract assets (images, icons)
      const assets = await this.extractAssets(fileKey, node);

      return {
        componentName,
        framework,
        code,
        styles,
        assets,
        designTokens,
      };
    } catch (error) {
      throw new Error(`Failed to convert to code: ${error}`);
    }
  }

  private extractDesignTokens(node: FigmaNode): Record<string, any> {
    const tokens: Record<string, any> = {};

    // Extract color tokens
    if (node.fills) {
      node.fills.forEach((fill, index) => {
        if (fill.type === 'SOLID' && fill.color) {
          const color = fill.color;
          tokens[`color-${index}`] = `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
        }
      });
    }

    // Extract spacing tokens
    if (node.paddingLeft !== undefined) {
      tokens.paddingLeft = `${node.paddingLeft}px`;
    }
    if (node.paddingRight !== undefined) {
      tokens.paddingRight = `${node.paddingRight}px`;
    }
    if (node.paddingTop !== undefined) {
      tokens.paddingTop = `${node.paddingTop}px`;
    }
    if (node.paddingBottom !== undefined) {
      tokens.paddingBottom = `${node.paddingBottom}px`;
    }
    if (node.itemSpacing !== undefined) {
      tokens.gap = `${node.itemSpacing}px`;
    }

    // Extract typography tokens
    if (node.style) {
      tokens.fontFamily = node.style.fontFamily;
      tokens.fontSize = `${node.style.fontSize}px`;
      tokens.fontWeight = node.style.fontWeight;
      if (node.style.lineHeightPx) {
        tokens.lineHeight = `${node.style.lineHeightPx}px`;
      }
      if (node.style.letterSpacing) {
        tokens.letterSpacing = `${node.style.letterSpacing}px`;
      }
    }

    // Extract border radius
    if (node.cornerRadius !== undefined) {
      tokens.borderRadius = `${node.cornerRadius}px`;
    }

    // Extract dimensions
    if (node.width !== undefined) {
      tokens.width = `${node.width}px`;
    }
    if (node.height !== undefined) {
      tokens.height = `${node.height}px`;
    }

    return tokens;
  }

  private sanitizeComponentName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^[0-9]/, 'Component')
      .replace(/^./, str => str.toUpperCase());
  }

  private generateCode(
    node: FigmaNode,
    framework: string,
    tokens: Record<string, any>
  ): { code: string; styles: string } {
    switch (framework) {
      case 'react':
        return this.generateReactCode(node, tokens);
      case 'vue':
        return this.generateVueCode(node, tokens);
      case 'angular':
        return this.generateAngularCode(node, tokens);
      case 'svelte':
        return this.generateSvelteCode(node, tokens);
      case 'html':
        return this.generateHTMLCode(node, tokens);
      default:
        throw new Error(`Unsupported framework: ${framework}`);
    }
  }

  private generateReactCode(node: FigmaNode, tokens: Record<string, any>): { code: string; styles: string } {
    const componentName = this.sanitizeComponentName(node.name);

    let jsx = '';
    let styles = '';

    if (node.type === 'TEXT') {
      jsx = `
import React from 'react';
import './styles.css';

const ${componentName} = () => {
  return (
    <div className="${componentName.toLowerCase()}">
      ${node.characters || 'Text content'}
    </div>
  );
};

export default ${componentName};
      `.trim();

      styles = `
.${componentName.toLowerCase()} {
  font-family: ${tokens.fontFamily || 'inherit'};
  font-size: ${tokens.fontSize || 'inherit'};
  font-weight: ${tokens.fontWeight || 'inherit'};
  line-height: ${tokens.lineHeight || 'inherit'};
  color: ${tokens['color-0'] || 'inherit'};
}
      `.trim();
    } else if (node.type === 'FRAME' || node.type === 'GROUP') {
      const childrenJSX = node.children
        ? node.children.map((child, index) => {
            if (child.type === 'TEXT') {
              return `<span key={${index}}>${child.characters || 'Text'}</span>`;
            }
            return `<div key={${index}} className="child-${index}"></div>`;
          }).join('\n      ')
        : '';

      jsx = `
import React from 'react';
import './styles.css';

const ${componentName} = () => {
  return (
    <div className="${componentName.toLowerCase()}">
      ${childrenJSX}
    </div>
  );
};

export default ${componentName};
      `.trim();

      styles = `
.${componentName.toLowerCase()} {
  display: ${node.layoutMode === 'HORIZONTAL' ? 'flex' : node.layoutMode === 'VERTICAL' ? 'flex' : 'block'};
  ${node.layoutMode === 'VERTICAL' ? 'flex-direction: column;' : ''}
  gap: ${tokens.gap || '0'};
  padding: ${tokens.paddingTop || '0'} ${tokens.paddingRight || '0'} ${tokens.paddingBottom || '0'} ${tokens.paddingLeft || '0'};
  width: ${tokens.width || 'auto'};
  height: ${tokens.height || 'auto'};
  background: ${tokens['color-0'] || 'transparent'};
  border-radius: ${tokens.borderRadius || '0'};
}
      `.trim();
    } else {
      jsx = `
import React from 'react';
import './styles.css';

const ${componentName} = () => {
  return (
    <div className="${componentName.toLowerCase()}">
      {/* Generated from Figma ${node.type} */}
    </div>
  );
};

export default ${componentName};
      `.trim();

      styles = `
.${componentName.toLowerCase()} {
  width: ${tokens.width || 'auto'};
  height: ${tokens.height || 'auto'};
  background: ${tokens['color-0'] || 'transparent'};
  border-radius: ${tokens.borderRadius || '0'};
}
      `.trim();
    }

    return { code: jsx, styles };
  }

  private generateVueCode(node: FigmaNode, tokens: Record<string, any>): { code: string; styles: string } {
    const componentName = this.sanitizeComponentName(node.name);

    const template = node.type === 'TEXT'
      ? `<div class="${componentName.toLowerCase()}">${node.characters || 'Text content'}</div>`
      : `<div class="${componentName.toLowerCase()}"><!-- Generated from Figma ${node.type} --></div>`;

    const code = `
<template>
  ${template}
</template>

<script>
export default {
  name: '${componentName}',
}
</script>

<style scoped>
${this.generateCSSFromTokens(componentName, tokens)}
</style>
    `.trim();

    return { code, styles: '' };
  }

  private generateAngularCode(node: FigmaNode, tokens: Record<string, any>): { code: string; styles: string } {
    const componentName = this.sanitizeComponentName(node.name);

    const template = node.type === 'TEXT'
      ? `<div class="${componentName.toLowerCase()}">${node.characters || 'Text content'}</div>`
      : `<div class="${componentName.toLowerCase()}"><!-- Generated from Figma ${node.type} --></div>`;

    const code = `
import { Component } from '@angular/core';

@Component({
  selector: 'app-${componentName.toLowerCase()}',
  template: \`${template}\`,
  styleUrls: ['./${componentName.toLowerCase()}.component.css']
})
export class ${componentName}Component {
}
    `.trim();

    const styles = this.generateCSSFromTokens(componentName, tokens);

    return { code, styles };
  }

  private generateSvelteCode(node: FigmaNode, tokens: Record<string, any>): { code: string; styles: string } {
    const componentName = this.sanitizeComponentName(node.name);

    const template = node.type === 'TEXT'
      ? `<div class="${componentName.toLowerCase()}">${node.characters || 'Text content'}</div>`
      : `<div class="${componentName.toLowerCase()}"><!-- Generated from Figma ${node.type} --></div>`;

    const code = `
${template}

<style>
${this.generateCSSFromTokens(componentName, tokens)}
</style>
    `.trim();

    return { code, styles: '' };
  }

  private generateHTMLCode(node: FigmaNode, tokens: Record<string, any>): { code: string; styles: string } {
    const componentName = this.sanitizeComponentName(node.name);

    const template = node.type === 'TEXT'
      ? `<div class="${componentName.toLowerCase()}">${node.characters || 'Text content'}</div>`
      : `<div class="${componentName.toLowerCase()}"><!-- Generated from Figma ${node.type} --></div>`;

    const styles = this.generateCSSFromTokens(componentName, tokens);

    return { code: template, styles };
  }

  private generateCSSFromTokens(componentName: string, tokens: Record<string, any>): string {
    const className = componentName.toLowerCase();
    let css = `.${className} {\n`;

    Object.entries(tokens).forEach(([key, value]) => {
      const cssProperty = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      css += `  ${cssProperty}: ${value};\n`;
    });

    css += '}';
    return css;
  }

  private async extractAssets(fileKey: string, node: FigmaNode): Promise<Array<{
    name: string;
    url: string;
    type: 'image' | 'icon' | 'font';
  }>> {
    const assets: Array<{ name: string; url: string; type: 'image' | 'icon' | 'font' }> = [];

    try {
      // Check if node has image fills
      if (node.fills) {
        for (const fill of node.fills) {
          if (fill.type === 'IMAGE' && fill.imageRef) {
            const images = await this.getImages(fileKey, [node.id], {
              format: 'png',
              scale: 2,
            });

            if (images.images[node.id]) {
              assets.push({
                name: `${node.name || 'image'}.png`,
                url: images.images[node.id] || '',
                type: 'image',
              });
            }
          }
        }
      }

      // Check for vector/icon nodes
      if (node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION') {
        const images = await this.getImages(fileKey, [node.id], {
          format: 'svg',
        });

        if (images.images[node.id]) {
          assets.push({
            name: `${node.name || 'icon'}.svg`,
            url: images.images[node.id] || '',
            type: 'icon',
          });
        }
      }

      // Recursively extract assets from children
      if (node.children) {
        for (const child of node.children) {
          const childAssets = await this.extractAssets(fileKey, child);
          assets.push(...childAssets);
        }
      }
    } catch (error) {
      console.warn(`Failed to extract assets from node ${node.id}:`, error);
    }

    return assets;
  }

  // Design System Sync
  async syncDesignTokens(fileKey: string): Promise<Record<string, any>> {
    try {
      const file = await this.getFile(fileKey);
      const tokens: Record<string, any> = {};

      // Extract color tokens from styles
      Object.entries(file.styles).forEach(([key, style]) => {
        if (style.styleType === 'FILL') {
          tokens[`color-${style.name.toLowerCase().replace(/\s+/g, '-')}`] = {
            name: style.name,
            description: style.description,
            key,
          };
        }
      });

      // Extract typography tokens
      Object.entries(file.styles).forEach(([key, style]) => {
        if (style.styleType === 'TEXT') {
          tokens[`typography-${style.name.toLowerCase().replace(/\s+/g, '-')}`] = {
            name: style.name,
            description: style.description,
            key,
          };
        }
      });

      return tokens;
    } catch (error) {
      throw new Error(`Failed to sync design tokens: ${error}`);
    }
  }

  // Design Change Detection
  async detectChanges(
    fileKey: string,
    previousVersion?: string
  ): Promise<{
    hasChanges: boolean;
    changedNodes: string[];
    newComponents: string[];
    deletedComponents: string[];
  }> {
    try {
      const currentFile = await this.getFile(fileKey);

      if (!previousVersion) {
        return {
          hasChanges: false,
          changedNodes: [],
          newComponents: [],
          deletedComponents: [],
        };
      }

      const previousFile = await this.getFile(fileKey, { version: previousVersion });

      // Compare component keys
      const currentComponents = new Set(Object.keys(currentFile.components));
      const previousComponents = new Set(Object.keys(previousFile.components));

      const newComponents = [...currentComponents].filter(key => !previousComponents.has(key));
      const deletedComponents = [...previousComponents].filter(key => !currentComponents.has(key));

      return {
        hasChanges: currentFile.version !== previousFile.version,
        changedNodes: [], // Would need detailed node comparison for this
        newComponents,
        deletedComponents,
      };
    } catch (error) {
      throw new Error(`Failed to detect changes: ${error}`);
    }
  }
}

// Factory function to create Figma integration instance
export function createFigmaIntegration(
  accessToken?: string,
  teamId?: string
): FigmaIntegration {
  const figmaToken = accessToken || process.env.FIGMA_ACCESS_TOKEN;

  if (!figmaToken) {
    throw new Error('Figma access token is required. Set FIGMA_ACCESS_TOKEN environment variable or pass accessToken parameter.');
  }

  return new FigmaIntegration({
    accessToken: figmaToken,
    teamId: teamId || process.env.FIGMA_TEAM_ID,
  });
}

export default FigmaIntegration;