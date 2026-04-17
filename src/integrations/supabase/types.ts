export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chamado_anexos: {
        Row: {
          caminho: string
          chamado_id: string
          created_at: string | null
          id: string
          nome_original: string
          updated_at: string | null
        }
        Insert: {
          caminho: string
          chamado_id: string
          created_at?: string | null
          id?: string
          nome_original: string
          updated_at?: string | null
        }
        Update: {
          caminho?: string
          chamado_id?: string
          created_at?: string | null
          id?: string
          nome_original?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chamado_anexos_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "chamados"
            referencedColumns: ["id"]
          },
        ]
      }
      chamados: {
        Row: {
          assumido_em: string | null
          created_at: string | null
          criado_por_id: string | null
          descricao: string
          finalizado_em: string | null
          id: string
          modulo_sider: string | null
          prioridade_id: string
          responsavel_id: string | null
          setor_id: string
          sla_vencimento: string | null
          solicitante_id: string
          status_id: string
          tipo_suporte_id: string
          titulo: string
          updated_at: string | null
        }
        Insert: {
          assumido_em?: string | null
          created_at?: string | null
          criado_por_id?: string | null
          descricao: string
          finalizado_em?: string | null
          id?: string
          modulo_sider?: string | null
          prioridade_id: string
          responsavel_id?: string | null
          setor_id: string
          sla_vencimento?: string | null
          solicitante_id: string
          status_id: string
          tipo_suporte_id: string
          titulo: string
          updated_at?: string | null
        }
        Update: {
          assumido_em?: string | null
          created_at?: string | null
          criado_por_id?: string | null
          descricao?: string
          finalizado_em?: string | null
          id?: string
          modulo_sider?: string | null
          prioridade_id?: string
          responsavel_id?: string | null
          setor_id?: string
          sla_vencimento?: string | null
          solicitante_id?: string
          status_id?: string
          tipo_suporte_id?: string
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chamados_criado_por_id_fkey"
            columns: ["criado_por_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamados_prioridade_id_fkey"
            columns: ["prioridade_id"]
            isOneToOne: false
            referencedRelation: "prioridades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamados_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamados_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamados_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamados_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chamados_tipo_suporte_id_fkey"
            columns: ["tipo_suporte_id"]
            isOneToOne: false
            referencedRelation: "tipo_suportes"
            referencedColumns: ["id"]
          },
        ]
      }
      classe_suportes: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      historico_chamados: {
        Row: {
          acao: string
          chamado_id: string
          created_at: string | null
          descricao: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          acao: string
          chamado_id: string
          created_at?: string | null
          descricao: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          acao?: string
          chamado_id?: string
          created_at?: string | null
          descricao?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historico_chamados_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "chamados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_chamados_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          chamado_id: string | null
          created_at: string
          id: string
          lida: boolean
          mensagem: string
          user_id: string
        }
        Insert: {
          chamado_id?: string | null
          created_at?: string
          id?: string
          lida?: boolean
          mensagem: string
          user_id: string
        }
        Update: {
          chamado_id?: string | null
          created_at?: string
          id?: string
          lida?: boolean
          mensagem?: string
          user_id?: string
        }
        Relationships: []
      }
      prioridades: {
        Row: {
          ativo: boolean | null
          cor: string
          created_at: string | null
          id: string
          nivel: number
          nome: string
          prazo_dias_uteis: number
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cor?: string
          created_at?: string | null
          id?: string
          nivel?: number
          nome: string
          prazo_dias_uteis?: number
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cor?: string
          created_at?: string | null
          id?: string
          nivel?: number
          nome?: string
          prazo_dias_uteis?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      setor_tipo_suporte: {
        Row: {
          created_at: string | null
          id: string
          setor_id: string
          tipo_suporte_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setor_id: string
          tipo_suporte_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setor_id?: string
          tipo_suporte_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "setor_tipo_suporte_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setor_tipo_suporte_tipo_suporte_id_fkey"
            columns: ["tipo_suporte_id"]
            isOneToOne: false
            referencedRelation: "tipo_suportes"
            referencedColumns: ["id"]
          },
        ]
      }
      setores: {
        Row: {
          ativo: boolean | null
          cor: string | null
          created_at: string | null
          email_responsavel: string | null
          id: string
          nome: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          email_responsavel?: string | null
          id?: string
          nome: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          cor?: string | null
          created_at?: string | null
          email_responsavel?: string | null
          id?: string
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      statuses: {
        Row: {
          cor: string
          created_at: string | null
          final: boolean | null
          id: string
          inicial: boolean | null
          nome: string
          ordem: number
          updated_at: string | null
        }
        Insert: {
          cor?: string
          created_at?: string | null
          final?: boolean | null
          id?: string
          inicial?: boolean | null
          nome: string
          ordem?: number
          updated_at?: string | null
        }
        Update: {
          cor?: string
          created_at?: string | null
          final?: boolean | null
          id?: string
          inicial?: boolean | null
          nome?: string
          ordem?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      tipo_suportes: {
        Row: {
          ativo: boolean | null
          classe_suporte_id: string | null
          created_at: string | null
          id: string
          nome: string
          prazo_dias_uteis: number
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          classe_suporte_id?: string | null
          created_at?: string | null
          id?: string
          nome: string
          prazo_dias_uteis?: number
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          classe_suporte_id?: string | null
          created_at?: string | null
          id?: string
          nome?: string
          prazo_dias_uteis?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tipo_suportes_classe_suporte_id_fkey"
            columns: ["classe_suporte_id"]
            isOneToOne: false
            referencedRelation: "classe_suportes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_setores: {
        Row: {
          created_at: string | null
          id: string
          setor_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          setor_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          setor_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_setores_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          ativo: boolean | null
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
          setor_id: string | null
          telefone: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          ativo?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          name: string
          role?: Database["public"]["Enums"]["app_role"]
          setor_id?: string | null
          telefone?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          ativo?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
          setor_id?: string | null
          telefone?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "setores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "suporte" | "gestor" | "usuario"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "suporte", "gestor", "usuario"],
    },
  },
} as const
