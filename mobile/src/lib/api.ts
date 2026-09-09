import { getAuthToken } from "./auth-storage";
import {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  MeResponse,
  ListWorkspacesResponse,
  GetWorkspaceResponse,
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  UpdateWorkspaceRequest,
  ListProjectsResponse,
  GetProjectResponse,
  CreateProjectRequest,
  CreateProjectResponse,
  UpdateProjectRequest,
  IssueFilters,
  ListIssuesResponse,
  GetIssueResponse,
  CreateIssueRequest,
  CreateIssueResponse,
  UpdateIssueRequest,
  UpdateIssueResponse,
  ListColumnsResponse,
  CreateColumnRequest,
  ReorderColumnsRequest,
  ListSprintsResponse,
  GetSprintResponse,
  CreateSprintRequest,
  CreateSprintResponse,
  UpdateSprintRequest,
  ListChannelsResponse,
  CreateChannelRequest,
  CreateChannelResponse,
  ListMessagesResponse,
  SendMessageRequest,
  SendMessageResponse,
  ListNotificationsResponse,
  MarkNotificationResponse,
  GetProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  ListWhiteboardsResponse,
  GetWhiteboardResponse,
  GetWorkspaceAnalyticsResponse,
  SearchResponse,
  Workspace,
  Project,
  Issue,
  Sprint,
  DiscussionChannel,
  DiscussionMessage,
  Column,
  Notification,
  User,
} from "../types/api";

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3000/api/v1";

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | null | undefined>;
  token?: string;
}

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Generic fetch wrapper for Workflow REST API endpoints
 */
export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, token: customToken, headers: customHeaders, ...fetchOptions } = options;

  let url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `${url.includes("?") ? "&" : "?"}${queryString}`;
    }
  }

  const token = customToken || (await getAuthToken());

  const headers = new Headers(customHeaders);
  if (!headers.has("Content-Type") && !(fetchOptions.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  console.log(`[API] ${fetchOptions.method || "GET"} ${url}`);

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  let data: any = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      (typeof data === "object" && data !== null && (data.error || data.message)) ||
      `Request failed with status ${response.status}`;
    console.log(`[API] Error ${response.status}:`, data);
    throw new ApiError(message, response.status, data);
  }

  console.log(`[API] Success ${response.status}`);
  return data as T;
}

/**
 * Structured API Modules
 */
export const api = {
  auth: {
    login: async (email: string, password?: string): Promise<LoginResponse> => {
      return apiClient<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },

    signup: async (data: SignupRequest): Promise<SignupResponse> => {
      return apiClient<SignupResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    me: async (): Promise<MeResponse> => {
      return apiClient<MeResponse>("/auth/me", {
        method: "GET",
      });
    },
  },

  workspaces: {
    list: async (): Promise<ListWorkspacesResponse> => {
      return apiClient<ListWorkspacesResponse>("/workspaces", {
        method: "GET",
      });
    },

    get: async (workspaceId: string): Promise<GetWorkspaceResponse> => {
      return apiClient<GetWorkspaceResponse>(`/workspaces/${workspaceId}`, {
        method: "GET",
      });
    },

    create: async (data: CreateWorkspaceRequest): Promise<CreateWorkspaceResponse> => {
      return apiClient<CreateWorkspaceResponse>("/workspaces", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (
      workspaceId: string,
      data: UpdateWorkspaceRequest
    ): Promise<GetWorkspaceResponse> => {
      return apiClient<GetWorkspaceResponse>(`/workspaces/${workspaceId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    delete: async (workspaceId: string): Promise<{ message: string }> => {
      return apiClient<{ message: string }>(`/workspaces/${workspaceId}`, {
        method: "DELETE",
      });
    },
  },

  projects: {
    list: async (workspaceId: string): Promise<ListProjectsResponse> => {
      return apiClient<ListProjectsResponse>(`/workspaces/${workspaceId}/projects`, {
        method: "GET",
      });
    },

    get: async (projectId: string): Promise<GetProjectResponse> => {
      return apiClient<GetProjectResponse>(`/projects/${projectId}`, {
        method: "GET",
      });
    },

    create: async (
      workspaceId: string,
      data: CreateProjectRequest
    ): Promise<CreateProjectResponse> => {
      return apiClient<CreateProjectResponse>(`/workspaces/${workspaceId}/projects`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (
      projectId: string,
      data: UpdateProjectRequest
    ): Promise<GetProjectResponse> => {
      return apiClient<GetProjectResponse>(`/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    delete: async (projectId: string): Promise<{ message: string }> => {
      return apiClient<{ message: string }>(`/projects/${projectId}`, {
        method: "DELETE",
      });
    },

    getColumns: async (projectId: string): Promise<ListColumnsResponse> => {
      return apiClient<ListColumnsResponse>(`/projects/${projectId}/columns`, {
        method: "GET",
      });
    },

    createColumn: async (
      projectId: string,
      data: CreateColumnRequest
    ): Promise<{ column: Column }> => {
      return apiClient<{ column: Column }>(`/projects/${projectId}/columns`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    reorderColumns: async (
      projectId: string,
      orderedColumnIds: string[]
    ): Promise<ListColumnsResponse> => {
      return apiClient<ListColumnsResponse>(`/projects/${projectId}/columns`, {
        method: "POST",
        body: JSON.stringify({ orderedColumnIds }),
      });
    },
  },

  issues: {
    list: async (
      projectId: string,
      filters?: IssueFilters
    ): Promise<ListIssuesResponse> => {
      return apiClient<ListIssuesResponse>(`/projects/${projectId}/issues`, {
        method: "GET",
        params: filters as any,
      });
    },

    get: async (issueId: string): Promise<GetIssueResponse> => {
      return apiClient<GetIssueResponse>(`/issues/${issueId}`, {
        method: "GET",
      });
    },

    create: async (
      projectId: string,
      data: CreateIssueRequest
    ): Promise<CreateIssueResponse> => {
      return apiClient<CreateIssueResponse>(`/projects/${projectId}/issues`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (
      issueId: string,
      data: UpdateIssueRequest
    ): Promise<UpdateIssueResponse> => {
      return apiClient<UpdateIssueResponse>(`/issues/${issueId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    delete: async (issueId: string): Promise<{ message: string }> => {
      return apiClient<{ message: string }>(`/issues/${issueId}`, {
        method: "DELETE",
      });
    },
  },

  sprints: {
    list: async (projectId: string): Promise<ListSprintsResponse> => {
      return apiClient<ListSprintsResponse>(`/projects/${projectId}/sprints`, {
        method: "GET",
      });
    },

    get: async (sprintId: string): Promise<GetSprintResponse> => {
      return apiClient<GetSprintResponse>(`/sprints/${sprintId}`, {
        method: "GET",
      });
    },

    create: async (
      projectId: string,
      data: CreateSprintRequest
    ): Promise<CreateSprintResponse> => {
      return apiClient<CreateSprintResponse>(`/projects/${projectId}/sprints`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    update: async (
      sprintId: string,
      data: UpdateSprintRequest
    ): Promise<{ sprint: Sprint }> => {
      return apiClient<{ sprint: Sprint }>(`/sprints/${sprintId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    delete: async (sprintId: string): Promise<{ message: string }> => {
      return apiClient<{ message: string }>(`/sprints/${sprintId}`, {
        method: "DELETE",
      });
    },
  },

  channels: {
    list: async (workspaceId: string): Promise<ListChannelsResponse> => {
      return apiClient<ListChannelsResponse>(`/workspaces/${workspaceId}/channels`, {
        method: "GET",
      });
    },

    create: async (
      workspaceId: string,
      data: CreateChannelRequest
    ): Promise<CreateChannelResponse> => {
      return apiClient<CreateChannelResponse>(`/workspaces/${workspaceId}/channels`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    getMessages: async (
      channelId: string,
      cursor?: string,
      limit?: number
    ): Promise<ListMessagesResponse> => {
      return apiClient<ListMessagesResponse>(`/channels/${channelId}/messages`, {
        method: "GET",
        params: { cursor, limit },
      });
    },

    sendMessage: async (
      channelId: string,
      data: SendMessageRequest
    ): Promise<SendMessageResponse> => {
      return apiClient<SendMessageResponse>(`/channels/${channelId}/messages`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  notifications: {
    list: async (limit?: number): Promise<ListNotificationsResponse> => {
      return apiClient<ListNotificationsResponse>("/notifications", {
        method: "GET",
        params: { limit },
      });
    },

    markRead: async (
      idOrAll: string | boolean
    ): Promise<MarkNotificationResponse> => {
      const body =
        typeof idOrAll === "boolean"
          ? { all: idOrAll }
          : { id: idOrAll };

      return apiClient<MarkNotificationResponse>("/notifications", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
  },

  profile: {
    get: async (): Promise<GetProfileResponse> => {
      return apiClient<GetProfileResponse>("/profile", {
        method: "GET",
      });
    },

    update: async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
      return apiClient<UpdateProfileResponse>("/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
  },

  whiteboards: {
    list: async (workspaceId: string): Promise<ListWhiteboardsResponse> => {
      return apiClient<ListWhiteboardsResponse>(`/workspaces/${workspaceId}/whiteboards`, {
        method: "GET",
      });
    },

    get: async (whiteboardId: string): Promise<GetWhiteboardResponse> => {
      return apiClient<GetWhiteboardResponse>(`/whiteboards/${whiteboardId}`, {
        method: "GET",
      });
    },
  },

  analytics: {
    get: async (
      workspaceId: string,
      params?: { projectId?: string; timeRangeDays?: number }
    ): Promise<GetWorkspaceAnalyticsResponse> => {
      return apiClient<GetWorkspaceAnalyticsResponse>(
        `/workspaces/${workspaceId}/analytics`,
        { method: "GET", params }
      );
    },
  },

  search: {
    workspace: async (workspaceId: string, q: string): Promise<SearchResponse> => {
      return apiClient<SearchResponse>(`/workspaces/${workspaceId}/search`, {
        method: "GET",
        params: { q },
      });
    },
  },
};

export default api;
