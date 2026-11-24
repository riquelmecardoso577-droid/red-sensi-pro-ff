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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_emails: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      cla_membros: {
        Row: {
          cla_id: string
          created_at: string
          usuario_id: string
        }
        Insert: {
          cla_id: string
          created_at?: string
          usuario_id?: string
        }
        Update: {
          cla_id?: string
          created_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cla_membros_cla_id_fkey"
            columns: ["cla_id"]
            isOneToOne: false
            referencedRelation: "clas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cla_membros_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      clas: {
        Row: {
          created_at: string
          descricao: string
          id: string
          lider_id: string | null
          nome: string
          tag: string
        }
        Insert: {
          created_at?: string
          descricao?: string
          id?: string
          lider_id?: string | null
          nome: string
          tag?: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          lider_id?: string | null
          nome?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "clas_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios: {
        Row: {
          created_at: string
          id: string
          post_id: string
          texto: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          texto: string
          usuario_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          texto?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      config: {
        Row: {
          chave_pix: string
          cidade: string
          id: number
          nome_recebedor: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          chave_pix?: string
          cidade?: string
          id?: number
          nome_recebedor?: string
          updated_at?: string
          whatsapp?: string
        }
        Update: {
          chave_pix?: string
          cidade?: string
          id?: number
          nome_recebedor?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      curtidas_posts: {
        Row: {
          created_at: string
          post_id: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          usuario_id?: string
        }
        Update: {
          created_at?: string
          post_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curtidas_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curtidas_posts_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      curtidas_videos: {
        Row: {
          created_at: string
          usuario_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          usuario_id?: string
          video_id: string
        }
        Update: {
          created_at?: string
          usuario_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curtidas_videos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curtidas_videos_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      desafios: {
        Row: {
          created_at: string
          descricao: string
          id: string
          premio: string
          termina_em: string | null
          titulo: string
        }
        Insert: {
          created_at?: string
          descricao?: string
          id?: string
          premio?: string
          termina_em?: string | null
          titulo: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          premio?: string
          termina_em?: string | null
          titulo?: string
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          created_at: string
          id: string
          sensi_id: string
          status: string
          usuario_id: string
          valor: number
          whatsapp_cliente: string
        }
        Insert: {
          created_at?: string
          id?: string
          sensi_id: string
          status?: string
          usuario_id?: string
          valor?: number
          whatsapp_cliente: string
        }
        Update: {
          created_at?: string
          id?: string
          sensi_id?: string
          status?: string
          usuario_id?: string
          valor?: number
          whatsapp_cliente?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_sensi_id_fkey"
            columns: ["sensi_id"]
            isOneToOne: false
            referencedRelation: "sensis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          created_at: string
          curtidas: number
          foto_video: string
          id: string
          legenda: string
          tipo: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          curtidas?: number
          foto_video: string
          id?: string
          legenda?: string
          tipo?: string
          usuario_id?: string
        }
        Update: {
          created_at?: string
          curtidas?: number
          foto_video?: string
          id?: string
          legenda?: string
          tipo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      seguidores: {
        Row: {
          created_at: string
          seguido_id: string
          seguidor_id: string
        }
        Insert: {
          created_at?: string
          seguido_id: string
          seguidor_id?: string
        }
        Update: {
          created_at?: string
          seguido_id?: string
          seguidor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seguidores_seguido_id_fkey"
            columns: ["seguido_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seguidores_seguidor_id_fkey"
            columns: ["seguidor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      sensis: {
        Row: {
          awm: number
          botao: number
          created_at: string
          destaque: boolean
          dpi: number
          geral: number
          id: string
          marca: string
          mira2x: number
          mira4x: number
          modelo: string
          olhadinha: number
          preco: number
          vermelho: number
        }
        Insert: {
          awm?: number
          botao?: number
          created_at?: string
          destaque?: boolean
          dpi?: number
          geral?: number
          id?: string
          marca: string
          mira2x?: number
          mira4x?: number
          modelo: string
          olhadinha?: number
          preco?: number
          vermelho?: number
        }
        Update: {
          awm?: number
          botao?: number
          created_at?: string
          destaque?: boolean
          dpi?: number
          geral?: number
          id?: string
          marca?: string
          mira2x?: number
          mira4x?: number
          modelo?: string
          olhadinha?: number
          preco?: number
          vermelho?: number
        }
        Relationships: []
      }
      stories: {
        Row: {
          created_at: string
          id: string
          midia_url: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          midia_url: string
          usuario_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          midia_url?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
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
      usuarios: {
        Row: {
          bio: string
          capas_dia: string
          capas_hoje: number
          capas_pendentes: number
          capas_pendentes_dia: string | null
          created_at: string
          data_nascimento: string | null
          foto: string | null
          id: string
          idade: number
          nick_ff: string
          nome: string
          patente: string
          verificado: boolean
          whatsapp: string
        }
        Insert: {
          bio?: string
          capas_dia?: string
          capas_hoje?: number
          capas_pendentes?: number
          capas_pendentes_dia?: string | null
          created_at?: string
          data_nascimento?: string | null
          foto?: string | null
          id: string
          idade?: number
          nick_ff?: string
          nome?: string
          patente?: string
          verificado?: boolean
          whatsapp?: string
        }
        Update: {
          bio?: string
          capas_dia?: string
          capas_hoje?: number
          capas_pendentes?: number
          capas_pendentes_dia?: string | null
          created_at?: string
          data_nascimento?: string | null
          foto?: string | null
          id?: string
          idade?: number
          nick_ff?: string
          nome?: string
          patente?: string
          verificado?: boolean
          whatsapp?: string
        }
        Relationships: []
      }
      verificados: {
        Row: {
          arroba: string
          created_at: string
          id: string
          id_ff: string
          print_url: string
          rede_social: string
          status: string
          usuario_id: string
        }
        Insert: {
          arroba: string
          created_at?: string
          id?: string
          id_ff: string
          print_url: string
          rede_social: string
          status?: string
          usuario_id?: string
        }
        Update: {
          arroba?: string
          created_at?: string
          id?: string
          id_ff?: string
          print_url?: string
          rede_social?: string
          status?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verificados_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          created_at: string
          curtidas: number
          id: string
          legenda: string
          sensi_id: string | null
          usuario_id: string
          video_url: string
        }
        Insert: {
          created_at?: string
          curtidas?: number
          id?: string
          legenda?: string
          sensi_id?: string | null
          usuario_id?: string
          video_url: string
        }
        Update: {
          created_at?: string
          curtidas?: number
          id?: string
          legenda?: string
          sensi_id?: string | null
          usuario_id?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_sensi_id_fkey"
            columns: ["sensi_id"]
            isOneToOne: false
            referencedRelation: "sensis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_capas_pendentes: {
        Args: never
        Returns: {
          capas_dia: string
          capas_hoje: number
          capas_pendentes: number
          foto: string
          id: string
          nick_ff: string
          nome: string
        }[]
      }
      admin_decidir_capas: {
        Args: { _aprovar: boolean; _usuario_id: string }
        Returns: undefined
      }
      admin_listar_sensis: {
        Args: never
        Returns: {
          awm: number
          botao: number
          created_at: string
          destaque: boolean
          dpi: number
          geral: number
          id: string
          marca: string
          mira2x: number
          mira4x: number
          modelo: string
          olhadinha: number
          preco: number
          vermelho: number
        }[]
        SetofOptions: {
          from: "*"
          to: "sensis"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_listar_usuarios: {
        Args: never
        Returns: {
          created_at: string
          data_nascimento: string
          foto: string
          id: string
          idade: number
          nick_ff: string
          nome: string
          verificado: boolean
          whatsapp: string
        }[]
      }
      config_checkout: {
        Args: never
        Returns: {
          chave_pix: string
          cidade: string
          nome_recebedor: string
          whatsapp: string
        }[]
      }
      contagem_seguidores: {
        Args: { _usuario_id: string }
        Returns: {
          seguidores: number
          seguindo: number
        }[]
      }
      enviar_capas: { Args: { _n: number }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      membros_por_cla: {
        Args: never
        Returns: {
          cla_id: string
          total: number
        }[]
      }
      meus_dados_privados: {
        Args: never
        Returns: {
          data_nascimento: string
          whatsapp: string
        }[]
      }
      midia_publicada: { Args: { _caminho: string }; Returns: boolean }
      perfil_completo: { Args: { _user_id: string }; Returns: boolean }
      sensi_valores: {
        Args: { _sensi_id: string }
        Returns: {
          awm: number
          botao: number
          dpi: number
          geral: number
          mira2x: number
          mira4x: number
          olhadinha: number
          vermelho: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
