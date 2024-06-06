import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CreatorService {
    getDirectoryStructure(dir: string, level = 0) {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        const children = files.map((file) => {
            console.log({ file, level });
            const fullPath = path.join(dir, file.name);
            if (file.isDirectory()) {
                // Only recurse if the level is less than 2
                return {
                    name: file.name,
                    children: level < 1 ? this.getDirectoryStructure(fullPath, level + 1) : [],
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
}