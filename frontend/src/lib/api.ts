import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Replace with your API URL
  headers: {
    "Content-Type": "application/json",
  },
});

// Define interfaces for chat request and response to match backend
export interface ChatRequestPayload {
  message: string;
  session_id?: string | null;
  mode?: string;
}

export interface BuildComponent {
  name: string;
  type: string;
  price: number;
  specs: Record<string, string>;
}

export interface BuildData {
  components: Record<string, BuildComponent> | BuildComponent[];
  total_price: number;
  requested_budget?: number;
}

export interface ChatResponseData {
  content: string;
  type: string; // e.g., "text", "build", "component_added", etc.
  data?: BuildData | null;
  session_id: string;
}

export const chatService = {
  sendMessage: async (
    payload: ChatRequestPayload
  ): Promise<ChatResponseData> => {
    const response = await api.post<ChatResponseData>("/chat/message", payload);
    return response.data;
  },
};

export const componentsService = {
  getComponentTypes: async () => {
    const response = await api.get("/components/types");
    return response.data;
  },
  getComponents: async (
    componentType: string,
    minPrice?: number,
    maxPrice?: number
  ) => {
    const params = new URLSearchParams();
    if (minPrice !== undefined) params.append("min_price", minPrice.toString());
    if (maxPrice !== undefined) params.append("max_price", maxPrice.toString());

    const response = await api.get(
      `/components/${componentType}?${params.toString()}`
    );
    return response.data;
  },
};

export const buildsService = {
  optimizeBuild: async (
    budget: number,
    usage: string,
    priorities: Record<string, number> = {}
  ) => {
    const response = await api.post("/builds/optimize", {
      budget,
      usage,
      priorities,
    });
    return response.data;
  },
  checkCompatibility: async () => {
    const response = await api.get("/builds/compatibility");
    return response.data;
  },
};

export default api;
