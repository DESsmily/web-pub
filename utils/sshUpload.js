/** 多线异步上传 */
module.exports = class SSHMultiSyncUpload {
  // 最大异步执行数
  numAsync = 1;
  //  任务队列
  /** @type {{taskId: number, f: () => any}[]} */ taskQueue = [];
  // 执行队列
  /** @type {{taskId: number, f: () => any, status: boolean}[]} */ execQueue =
    [];
  /** @type {(e:{error: Error; taskId?: number}) => void} */ errorFn;
  /** @type {(e:{error: Error; taskId?: number}) => void} */ successFn;
  /** @type {(e:{time: Date;}) => void} */ finishFn;
  countTime = 0;
  runningTask = 0;
  constructor(
    options = {
      numAsync: 1,
    }
  ) {
    this.numAsync = options.numAsync || 1;
  }

  addTask(task) {
    this.taskQueue.push({
      taskId: this.taskQueue.length + 1,
      f: task,
    });
  }

  Run() {
    if (this.numAsync > this.taskQueue.length) {
      this.numAsync = this.taskQueue.length;
    }
    this.retrieveTask();

    for (let i = 0; i < this.numAsync; i++) {
      this.worker();
    }
  }
  async worker() {
    const start = Date.now();
    while (this.execQueue.length) {
      this.runningTask++;
      // 从队列中取出任务
      const task = this.execQueue.shift();
      try {
        await task.f();
        this.successFn && this.successFn({ taskId: task.taskId });
      } catch (error) {
        this.errorFn && this.errorFn({ error, taskId: task.taskId });
      }
      task.status = true;
      this.countTime = Date.now() - start;
      this.runningTask--;
      if (this.runningTask <= 0) {
        this.finishFn && this.finishFn({ time: this.countTime });
      }
    }
  }
  retrieveTask() {
    // 从队列中取出到执行任务
    this.taskQueue.forEach(async (item, i) => {
      this.execQueue.push(item);
    });
  }
  onError(/** @type {(e:{error: Error; taskId?: number}) => void} */ callbak) {
    this.error = callbak || (() => {});
  }
  onSuccess(
    /** @type {(e:{error: Error; taskId?: number}) => void} */ callbak
  ) {
    this.successFn = callbak || (() => {});
  }
  onFinish(/** @type { (e:{time: Date;}) => void} */ callbak) {
    this.finishFn = callbak || (() => {});
  }
};
