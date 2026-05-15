import { Type } from "@google/genai";

export const deleteTaskDeclaration = {
  name: "delete_task",
  description:
    "Apaga uma tarefa existente. Se o utilizador disser 'apaga essa tarefa', 'apaga a última' ou similar sem indicar o id, omite o campo id — o backend resolve para a tarefa mais recente.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: {
        type: Type.INTEGER,
        description: "ID da tarefa a apagar. Omitir se o utilizador se referir implicitamente à última tarefa.",
      },
    },
    required: [],
  },
};
