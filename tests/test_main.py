def test_get_weights(client, mock_supabase):
    mock_supabase.rpc.return_value.execute.return_value.data = [3, 5, 1]

    response = client.get("/projects/1/weights")

    assert response.status_code == 200
    assert response.json() == [3, 5, 1]

    mock_supabase.rpc.assert_called_with("get_weight_values_by_project", {"p_id": 1})


def test_weights_avg_rejects_too_many_ids(client, mock_supabase):
    query = "&".join(f"criterion_id={i}" for i in range(201))

    response = client.get(f"/projects/1/weights/avg?{query}")

    assert response.status_code == 400
    mock_supabase.rpc.assert_not_called()


def test_alternative_avg_score_rejects_too_many_ids(client, mock_supabase):
    query = "&".join(f"alternative_id={i}" for i in range(201))

    response = client.get(f"/projects/1/alternatives/score/avg?{query}")

    assert response.status_code == 400
    mock_supabase.rpc.assert_not_called()