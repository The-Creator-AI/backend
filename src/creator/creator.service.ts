import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CreatorService {
    getDirectoryStructure(dir: string, loadShallow: boolean = false, level = 0) {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        const children = files
          .filter(file => !['.git', 'node_modules'].includes(file.name)) // Filter out unwanted directories
          .map((file) => {
            const fullPath = path.join(dir, file.name);
            if (file.isDirectory()) {
                return {
                    name: file.name,
                    children: loadShallow && level >= 1 ? [] : this.getDirectoryStructure(fullPath, loadShallow, level + 1),
                };
            } else {
                return { name: file.name };
            }
        });
        return children;
    }


    getFileContent(filePath: string): string {
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            return data;
        } catch (error) {
            console.error('Error reading file:', error);
            return 'Error reading file';
        }
    }

    readSelectedFilesContent(filePaths: string[]): { [filePath: string]: string } {
        const fileContents: { [filePath: string]: string } = {};
    
        for (const filePath of filePaths) {
          try {
            fileContents[filePath] = fs.readFileSync(filePath, 'utf8');
          } catch (error) {
            console.error(`Error reading file ${filePath}: ${error}`);
            // You might want to handle the error more gracefully, 
            // e.g., add a placeholder value to fileContents[filePath] 
          }
        }
    
        return fileContents;
      }
}