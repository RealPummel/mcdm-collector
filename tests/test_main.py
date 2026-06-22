def test_get_weights(client, mock_supabase):
    mock_supabase.rpc.return_value.execute.return_value.data = [3, 5, 1]
    
    response = client.get("/projects/1/weights")
    
    assert response.status_code == 200
    assert response.json() == [3, 5, 1]
    
    mock_supabase.rpc.assert_called_with("get_weight_values_by_project", {"p_id": 1})