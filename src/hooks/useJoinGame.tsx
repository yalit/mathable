export const useJoinGame = () => {
  const joinGame = (gameToken: string, playerToken: string) => {
    document.location = `/game/${gameToken}/player/${playerToken}`;
  };

  return { joinGame };
};
