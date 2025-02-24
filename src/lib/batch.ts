import { Movie, MovieDetails } from './tmdb';

// Batch size configuration
const BATCH_SIZE = 10;
const BATCH_DELAY = 100; // ms between batches

// Queue for batching requests
interface QueueItem<T> {
  id: number | string;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

class RequestBatcher<T> {
  private queue: QueueItem<T>[] = [];
  private timeout: NodeJS.Timeout | null = null;
  private processing = false;

  constructor(
    private batchFn: (ids: (number | string)[]) => Promise<Map<number | string, T>>,
    private delay: number = BATCH_DELAY
  ) {}

  async add(id: number | string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ id, resolve, reject });
      this.scheduleProcessing();
    });
  }

  private scheduleProcessing() {
    if (this.timeout || this.processing) return;
    
    this.timeout = setTimeout(() => {
      this.timeout = null;
      this.processQueue();
    }, this.delay);
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const batch = this.queue.splice(0, BATCH_SIZE);
    const ids = batch.map(item => item.id);

    try {
      const results = await this.batchFn(ids);
      
      // Resolve promises for each item
      batch.forEach(item => {
        const result = results.get(item.id);
        if (result) {
          item.resolve(result);
        } else {
          item.reject(new Error(`No result for ID ${item.id}`));
        }
      });
    } catch (error) {
      // Reject all promises in the batch
      batch.forEach(item => item.reject(error));
    }

    this.processing = false;
    
    // Process next batch if there are items in the queue
    if (this.queue.length > 0) {
      this.scheduleProcessing();
    }
  }
}

// Create batchers for different types of requests
const movieDetailsBatcher = new RequestBatcher<MovieDetails>(async (ids) => {
  // Implementation will be in tmdb.ts
  throw new Error('Not implemented');
});

const recommendationsBatcher = new RequestBatcher<Movie[]>(async (ids) => {
  // Implementation will be in tmdb.ts
  throw new Error('Not implemented');
});

export { movieDetailsBatcher, recommendationsBatcher };