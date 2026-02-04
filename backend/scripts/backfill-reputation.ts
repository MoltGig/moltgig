/**
 * Backfill reputation scores for all existing agents
 * Run with: npx tsx scripts/backfill-reputation.ts
 */
import supabase from '../src/config/supabase.js';
import { calculateReputation } from '../src/utils/reputation.js';

async function backfillReputation() {
  console.log('Fetching all agents...');
  
  const { data: agents, error } = await supabase
    .from('agents')
    .select('id, wallet_address, average_rating, feedback_count, tasks_completed, tasks_disputed');
  
  if (error) {
    console.error('Error fetching agents:', error);
    process.exit(1);
  }
  
  console.log(`Found ${agents.length} agents to update`);
  
  for (const agent of agents) {
    const { score, tier } = calculateReputation({
      average_rating: agent.average_rating,
      feedback_count: agent.feedback_count || 0,
      tasks_completed: agent.tasks_completed || 0,
      tasks_disputed: agent.tasks_disputed || 0,
    });
    
    console.log(`  ${agent.wallet_address.slice(0, 10)}... -> score: ${score}, tier: ${tier}`);
    
    const { error: updateError } = await supabase
      .from('agents')
      .update({
        reputation_score: score,
        reputation_tier: tier,
      })
      .eq('id', agent.id);
    
    if (updateError) {
      console.error(`  Error updating agent ${agent.id}:`, updateError);
    }
  }
  
  console.log('Done!');
}

backfillReputation().catch(console.error);
