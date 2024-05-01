using System;
using System.Collections.Generic;

namespace FIGAPI.Data;

public partial class ArtistProfile
{
    public string? Name { get; set; }

    public string? Event { get; set; }

    public int UserId { get; set; }

    public string? Phone_Number { get; set; }

    public string? Email_Address { get; set; }

    public string? Personal_Bio { get; set; }

    public int? Instagram { get; set; }
    public int? Facebook { get; set; }
    public int? Tiktok { get; set; }
    public int? Youtube { get; set; }
    public int? Twitter { get; set; }
    public int? Personal_Website { get; set; }

}
