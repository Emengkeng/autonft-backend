/* declare module 'bull' {
    interface Queue {
      add(data: any, options?: any): Promise<any>;
      process(callback: (job: any) => Promise<void>): void;
    }
  
    function Queue(name: string, options?: any): Queue;
  
    export = Queue;
}
   */