﻿namespace FIGAPI.Models
{
    public class RefreshToken
    {
        public string Token { get; set; }
        public DateTime Created { get; set; }
        public DateTime Expires { get; set; }
        public string refreshToken { get; set; }
    }
}
