import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { Text } from 'renderer/components/text';
import { VetoEntry } from 'renderer/vetos/components/veto-entry';
import { Veto } from 'renderer/vetos/types/veto';
import { useVetosState, useVetosDispatch } from 'renderer/vetos/vetos-context';
import { Link } from 'renderer/components/link';
import { VetosResponse } from 'renderer/types/api';
import { useApiAddress } from 'renderer/settings/use-api-address';

const VetosWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: auto;
  margin-right: auto;
  width: 800px;
  @media (max-width: 768px) {
    width: auto;
  }
`;

const HomeLink = styled(Link)`
  align-self: flex-start;
  margin-bottom: 20px;
`;

export function Vetos() {
  const [error, setError] = useState<string | undefined>(undefined);
  const vetos = useVetosState();
  const dispatch = useVetosDispatch();
  const [isFetching, setIsFetching] = useState(true);
  const apiAddress = useApiAddress();

  const fetchVetos = useCallback(async () => {
    try {
      const response = await fetch(`${apiAddress}/api/vetos`);
      if (response.status === 500) {
        throw new Error('An error occurred while fetching vetos');
      }

      const json: VetosResponse = await response.json();
      const vetos: Veto[] = json.map((veto) => {
        return {
          id: veto.id,
          bestOf: veto.best_of,
          teamOneName: veto.team_one_name,
          teamTwoName: veto.team_two_name,
          createdAt: new Date(veto.created_at),
          votes: veto.votes.map((vote) => {
            return {
              id: vote.id,
              type: vote.type,
              teamNumber: vote.team_number,
              mapName: vote.map_name,
            };
          }),
        };
      });
      dispatch({ type: 'set', vetos });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while fetching vetos');
      }
    } finally {
      setIsFetching(false);
    }
  }, [apiAddress, dispatch]);

  useEffect(() => {
    fetchVetos();
  }, [fetchVetos]);

  const renderContent = () => {
    if (isFetching) {
      return <Text>Loading...</Text>;
    }

    if (error) {
      return (
        <div>
          <Text color="danger">{error}</Text>
          <Text color="danger">Make sure the database is running and the endpoint is correct in the settings!</Text>
        </div>
      );
    }

    return vetos.map((veto) => {
      return <VetoEntry veto={veto} key={`veto-${veto.id}`} />;
    });
  };

  return (
    <VetosWrapper>
      <HomeLink to="/">Home</HomeLink>
      {renderContent()}
    </VetosWrapper>
  );
}
