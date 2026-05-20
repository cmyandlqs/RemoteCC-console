import path from "node:path";
import fs from "node:fs";

export type ProjectRecord = {
  id: string;
  name: string;
  rootPath: string;
  enabled: boolean;
};

export class ProjectServiceError extends Error {
  constructor(
    message: string,
    readonly code:
      | "INVALID_NAME"
      | "INVALID_PATH"
      | "PATH_NOT_FOUND"
      | "DUPLICATE_PATH"
      | "PROJECT_NOT_FOUND"
      | "PROJECT_DISABLED",
  ) {
    super(message);
    this.name = "ProjectServiceError";
  }
}

export class ProjectService {
  private readonly projects: ProjectRecord[] = [];

  list(): ProjectRecord[] {
    return this.projects;
  }

  create(input: Pick<ProjectRecord, "name" | "rootPath">): ProjectRecord {
    const name = input.name.trim();
    const rootPath = path.normalize(input.rootPath.trim());

    if (!name) {
      throw new ProjectServiceError("项目名称不能为空。", "INVALID_NAME");
    }

    if (!rootPath || !path.isAbsolute(rootPath)) {
      throw new ProjectServiceError("项目路径必须是绝对路径。", "INVALID_PATH");
    }

    if (!fs.existsSync(rootPath)) {
      throw new ProjectServiceError("项目路径不存在。", "PATH_NOT_FOUND");
    }

    if (this.projects.some((project) => project.rootPath === rootPath)) {
      throw new ProjectServiceError("项目路径已注册。", "DUPLICATE_PATH");
    }

    const project: ProjectRecord = {
      id: `proj_${this.projects.length + 1}`,
      name,
      rootPath,
      enabled: true,
    };
    this.projects.push(project);
    return project;
  }

  getById(projectId: string): ProjectRecord {
    const project = this.projects.find((item) => item.id === projectId);

    if (!project) {
      throw new ProjectServiceError("项目不存在。", "PROJECT_NOT_FOUND");
    }

    if (!project.enabled) {
      throw new ProjectServiceError("项目已被禁用。", "PROJECT_DISABLED");
    }

    return project;
  }
}
