import { getSupabaseClient } from '../lib/supabase.js'

export const REMOTE_TABLES = Object.freeze([
  'user_settings', 'strategy', 'offers', 'formulas', 'content_topics',
  'sprints', 'publications', 'evidence', 'evaluations', 'migration_imports',
])

// Stable pagination, respecting editorial order rather than UUID order alone.
const TABLE_ORDER = {
  formulas: 'sort_order', content_topics: 'sort_order', publications: 'published_on',
  sprints: 'start_date', evidence: 'observed_at', evaluations: 'evaluated_at',
  migration_imports: 'created_at',
}

// Explicit opt-in factory, never instantiated by the local hook.
// This is asynchronous row access, NOT a drop-in replacement for the synchronous document API.
export function createSupabaseRepository(getClient = getSupabaseClient) {
  function table(name) {
    if (!REMOTE_TABLES.includes(name)) throw new Error('Tabela não permitida.')
    return getClient().from(name)
  }
  async function result(query) {
    const { data, error } = await query
    if (error) throw error
    return data
  }
  return {
    list(name, { offset = 0, limit = 100 } = {}) {
      if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 1000) {
        throw new Error('Paginação inválida.')
      }
      let query = table(name).select('*')
      const column = TABLE_ORDER[name]
      if (column) query = query.order(column, { ascending: column === 'sort_order', nullsFirst: false })
      return result(query.order('id').range(offset, offset + limit - 1))
    },
    get(name, id) {
      return result(table(name).select('*').eq('id', id).maybeSingle())
    },
    insert(name, values) {
      if (name === 'evaluations') throw new Error('Use recordEvaluation para registrar avaliações.')
      // user_id defaults to auth.uid() in PostgreSQL; RLS checks ownership.
      return result(table(name).insert(values).select().single())
    },
    update(name, id, changes) {
      if (name === 'evaluations' || (name === 'formulas' && 'status' in changes)) {
        throw new Error('Use recordEvaluation para registrar histórico e status em uma transação.')
      }
      if (['id', 'user_id', 'created_at', 'legacy_id'].some((key) => key in changes)) {
        throw new Error('Identidade e origem do registro não podem ser alteradas pelo repositório.')
      }
      return result(table(name).update(changes).eq('id', id).select().single())
    },
    recordEvaluation({ criteria, publicationId = null, formulaId = null, decision = null,
      rationale = '', learning = '', nextAdjustment = '', evaluatedAt,
      newFormulaStatus = null }) {
      if (Boolean(publicationId) === Boolean(formulaId)) {
        throw new Error('Informe exclusivamente uma publicação ou uma fórmula.')
      }
      if (publicationId && newFormulaStatus !== null) {
        throw new Error('Avaliação de publicação não altera status de fórmula.')
      }
      const args = {
        p_criteria: criteria, p_publication_id: publicationId, p_formula_id: formulaId,
        p_decision: decision, p_rationale: rationale, p_learning: learning,
        p_next_adjustment: nextAdjustment, p_new_formula_status: newFormulaStatus,
      }
      // Omit undefined so PostgreSQL supplies the evaluation timestamp.
      if (evaluatedAt !== undefined) args.p_evaluated_at = evaluatedAt
      return result(getClient().rpc('record_evaluation', args))
    },
  }
}
