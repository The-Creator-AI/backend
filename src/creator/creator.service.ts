import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class CreatorService {
    getDirectoryStructure(): any {
        const directoryPath = process.cwd(); // Get the current working directory
        const files = fs.readdirSync(directoryPath, { withFileTypes: true });

        const buildTree = (files: fs.Dirent[], path: string): any => {
            const tree = files.map((file) => {
                const fullPath = `${path}/${file.name}`;
                if (file.isDirectory()) {
                    return {
                        name: file.name,
                        children: buildTree(
                            fs.readdirSync(fullPath, { withFileTypes: true }),
                            fullPath
                        ),
                    };
                } else {
                    return { name: file.name };
                }
            });
            return tree;
        };

        const directoryStructure = buildTree(files, directoryPath);
        return directoryStructure;
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
}