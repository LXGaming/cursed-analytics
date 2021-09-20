export class ProjectDownload {

  readonly id: number;

  readonly projectId: number;

  readonly timestamp: Date;

  readonly value: number;

  constructor(id: number, projectId: number, timestamp: Date, value: number) {
    this.id = id;
    this.projectId = projectId;
    this.timestamp = timestamp;
    this.value = value;
  }
}