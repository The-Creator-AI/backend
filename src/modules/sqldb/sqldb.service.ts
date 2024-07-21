import { Injectable } from '@nestjs/common';
import { EntityTarget, QueryRunner } from 'typeorm';
import { Connection } from 'typeorm/connection/Connection';
import { PaginationDto } from './dto/pagination.dto';

@Injectable()
export class SQLDBService {
  queryRunner: QueryRunner;
  // Reference - https://chat.openai.com/share/50b11050-33f4-41a8-8b82-cd6cb21c0e42
  private transactionQueue: (() => Promise<void>)[] = [];
  private isProcessingQueue = false;

  constructor(readonly connection: Connection) {
    this.queryRunner = this.connection.createQueryRunner();
  }

  async enqueue(fn: () => Promise<void>): Promise<void> {
    return new Promise<void>((resolve) => {
      this.transactionQueue.push(async () => {
        await fn();
        resolve();
      });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (!this.isProcessingQueue && this.transactionQueue.length > 0) {
      this.isProcessingQueue = true;
      const nextFn = this.transactionQueue.shift();
      if (nextFn) {
        await nextFn();
      }
      this.isProcessingQueue = false;
      this.processQueue();
    }
  }

  async query(props: {
    query: string;
    params?: any[];
    pagination?: PaginationDto;
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      this.enqueue(async () => {
        await this.queryRunner.connect();

        try {
          await this.queryRunner.startTransaction();

          const { query, params } = (() => {
            if (props.pagination) {
              return this.getPaginatedQuery({
                query: props.query,
                params: props.params,
                pagination: props.pagination,
              });
            } else {
              return {
                query: props.query,
                params: props.params,
              };
            }
          })();

          // console.log({ query, params });

          const queryResult = await this.queryRunner.query(query, params);
          await this.queryRunner.commitTransaction();
          // console.log({ queryResult });
          // return queryResult;
          resolve(queryResult);
        } catch (err) {
          console.error({ err: err.message });
          await this.queryRunner.rollbackTransaction();
          reject(err.message);
        } finally {
          await this.queryRunner.release();
        }
      });
    });
  }

  private getPaginatedQuery(props: {
    pagination: PaginationDto;
    query: string;
    params?: any[];
  }) {
    const { pagination, query, params } = props;
    const { pageSize, pageNumber } = pagination;
    const paramCount = params?.length || 0;
    const queryStringSuffix = `limit $${paramCount + 1} offset $${
      paramCount + 2
    }`;
    const limit = pageSize || 10;
    const offset = ((pageNumber || 1) - 1) * (pageSize || 10);
    const queryParams = params ? [...params] : [];
    queryParams.push(limit);
    queryParams.push(offset);
    return {
      query: `${query} ${queryStringSuffix}`,
      params: queryParams,
    };
  }

  getTableName<T>(entity: EntityTarget<T>) {
    return this.connection.manager.getRepository<T>(entity).metadata.tableName;
  }
}
