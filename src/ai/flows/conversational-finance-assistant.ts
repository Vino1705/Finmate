
'use server';

/**
 * @fileOverview An AI-powered chatbot for answering financial queries, simulating scenarios, and providing role-specific budgeting tips.
 *
 * - conversationalFinanceAssistant - A function that handles user interactions and provides financial advice.
 * - ConversationalFinanceAssistantInput - The input type for the conversationalFinanceAssistant function.
 * - ConversationalFinanceAssistantOutput - The return type for the conversationalFinanceAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ConversationalFinanceAssistantInputSchema = z.object({
  query: z.string().describe('The user query.'),
  totalMonthlyIncome: z.number().describe('Total income received for the current month.'),
  dailySpendingLimit: z.number().describe('The user planned daily spending limit.'),
  essentialExpensesLogged: z.number().describe('Total essential expenses (Needs) already logged this month.'),
  discretionaryExpensesLogged: z.number().describe('Total discretionary expenses (Wants) already logged this month.'),
  savingsGoal: z.number().describe('User-defined monthly saving goal.'),
  remainingDaysInMonth: z.number().describe('Remaining days in the current month including today.'),
  hasData: z.boolean().describe('Whether spending data is available.'),
});
export type ConversationalFinanceAssistantInput = z.infer<
  typeof ConversationalFinanceAssistantInputSchema
>;

const ConversationalFinanceAssistantOutputSchema = z.object({
  response: z.string().describe('The response from the AI chatbot.'),
});
export type ConversationalFinanceAssistantOutput = z.infer<
  typeof ConversationalFinanceAssistantOutputSchema
>;

export async function conversationalFinanceAssistant(
  input: ConversationalFinanceAssistantInput
): Promise<ConversationalFinanceAssistantOutput> {
  return conversationalFinanceAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'conversationalFinanceAssistantPrompt',
  input: { schema: ConversationalFinanceAssistantInputSchema },
  output: { schema: ConversationalFinanceAssistantOutputSchema },
  model: 'googleai/gemini-2.0-flash',
  prompt: `You are a personal finance assistant. You must follow these strict rules:

IMPORTANT RULES:
1. FINANCE ONLY: You are strictly a personal finance assistant. Do NOT answer any questions unrelated to personal finance, budgeting, or the user's financial data provided here.
2. If the user asks about anything else (e.g., science, history, jokes, general knowledge, advice on non-financial life events), respond with: "I'm sorry, but that is out of my knowledge. I can only assist with your personal finance and spending data."
3. You must ONLY use the user's actual recorded transactions and balances provided in the context.
2. Do NOT assume income, expenses, lifestyle, profession, or demographics.
3. Do NOT give generic financial advice.
4. Do NOT fabricate numbers or estimates.
5. If required data is missing ({{hasData}} is false), respond with: "I don't have enough spending data yet to calculate your safe spending limit."

## User Financial Data:
- Total income: ₹{{totalMonthlyIncome}}
- Fixed Daily Spending Limit: ₹{{dailySpendingLimit}}
- Essential expenses (Needs) logged: ₹{{essentialExpensesLogged}}
- Discretionary expenses (Wants) logged: ₹{{discretionaryExpensesLogged}}
- Savings goal: ₹{{savingsGoal}}
- Remaining days: {{remainingDaysInMonth}}

## Task:
1. Identify SAFE DAILY LIMIT: This is the user's fixed daily spending limit (₹{{dailySpendingLimit}}).
2. If the user asks about 'Today': Subtract today's specific spending from that fixed Daily Limit.
3. Use the contextual data to answer the user's query relative to their fixed spending goals.

## Output Format:
- One short explanation paragraph.
- One clear numeric result.
- No motivational talk.
- No generic advice.
- No assumptions.
- Do NOT use Markdown headers or bold text unless necessary for the numeric result.

Example Style: "Based on your logged transactions so far, you have ₹X remaining for discretionary spending this month. With Y days left, your safe daily spending limit is ₹Z."

User Query: "{{query}}"`,
});

const conversationalFinanceAssistantFlow = ai.defineFlow(
  {
    name: 'conversationalFinanceAssistantFlow',
    inputSchema: ConversationalFinanceAssistantInputSchema,
    outputSchema: ConversationalFinanceAssistantOutputSchema,
  },
  async (input: ConversationalFinanceAssistantInput) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('AI model returned no output.');
      }
      return output;
    } catch (error) {
      console.error('Error in conversationalFinanceAssistantFlow:', error);
      return {
        response:
          'Sorry, I am having trouble connecting to my knowledge base right now. Please try again in a moment.',
      };
    }
  }
);
