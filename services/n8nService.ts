import { N8N_WEBHOOK_URL } from '../constants';
import { N8NResponse } from '../types';

/**
 * Sends a message to the n8n webhook and retrieves the response.
 */
export const sendMessageToN8N = async (message: string): Promise<string> => {
  
  // Simulation mode if URL is not configured
  // Casting to string avoids TS strict comparison errors if constant is a specific string type
  if ((N8N_WEBHOOK_URL as string) === 'PLACEHOLDER_URL') {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
    return `Simulação: Recebi sua mensagem: "${message}". \n\nPara funcionar de verdade, configure a constante N8N_WEBHOOK_URL no arquivo constants.ts com o link do seu webhook n8n.`;
  }

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        chatInput: message, // Adjust key based on what your n8n webhook expects
        timestamp: new Date().toISOString()
      }),
    });

    if (!response.ok) {
      // Handle HTTP errors specifically to help debugging n8n setup
      let errorMsg = `Erro HTTP: ${response.status}`;
      
      if (response.status === 404) {
        errorMsg = `⚠️ **Erro 404 (Not Found)**\n\nO n8n retornou que o webhook não foi encontrado. Verifique se:\n1. O workflow está **Ativo** (switch no topo direito do n8n).\n2. A URL é a de **Produção** (sem /test/ se for webhook de produção).\n3. O método está correto (POST).`;
      } else if (response.status === 500) {
        errorMsg = `⚠️ **Erro 500 (Server Error)**\n\nOcorreu um erro dentro do fluxo do n8n. Verifique o "Execution Log" no n8n para ver onde falhou.`;
      } else if (response.status === 405) {
        errorMsg = `⚠️ **Erro 405 (Method Not Allowed)**\n\nO método HTTP foi rejeitado. O código envia **POST**. Verifique se o webhook do n8n está configurado para POST.`;
      }

      return errorMsg;
    }

    // 1. Get raw text first to avoid crashing on invalid JSON
    const textData = await response.text();

    // 2. Try to parse as JSON
    try {
        const data = JSON.parse(textData);
        
        // Handle common N8N return structures
        if (typeof data === 'string') return data;
        if (data.output) return data.output;
        if (data.text) return data.text;
        if (data.message) return data.message;
        
        // If it's an object/array but we don't know the key, prettify it
        return JSON.stringify(data, null, 2);
    } catch (e) {
        // If it wasn't JSON, return the raw text if it exists
        if (textData && textData.trim().length > 0) {
            return textData;
        }
        return "⚠️ O n8n retornou uma resposta vazia ou formato inválido.";
    }

  } catch (error: any) {
    console.error('Erro ao enviar mensagem para n8n:', error);
    
    // Specific handling for Network/CORS errors
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return `⚠️ **Erro de Conexão (CORS/Rede)**\n\nNão foi possível conectar ao n8n em:\n\`${N8N_WEBHOOK_URL}\`\n\nCausas prováveis:\n1. Problema de **CORS** (Adicione 'Allowed Origins: *' no nó Webhook).\n2. O n8n está offline ou inacessível.\n3. Bloqueio de navegador (Mixed Content se usar HTTP sem S).`;
    }

    // Return specific error message instead of throwing, so the user sees it in the chat
    return `⚠️ **Erro Técnico:**\n${error.message || 'Erro desconhecido'}`;
  }
};